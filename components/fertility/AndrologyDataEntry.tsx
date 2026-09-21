'use client';

import React, { useState, useEffect } from 'react';
import { andrologyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, ClipboardList, Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

export interface CasaSemenAnalysisData {
  // Patient Info & Sampling
  abstinence_days: number | string;
  collection_date: string;
  analysis_date: string;
  time_to_analysis_min: number | string;
  collection_place: string;
  referring_physician: string;

  // Macroscopic
  volume_ml: number | string;
  liquefaction_time_min: number | string;
  appearance: string;
  ph: number | string;
  viscosity: string;

  // Motility
  total_motility_pct: number | string;
  rapid_progressive_grade_a: number | string;
  slow_progressive_grade_b: number | string;
  non_progressive_grade_c: number | string;
  immotile_grade_d: number | string;
  progressive_motility_pct: number | string;
  sperm_motility_index: number | string;

  // Concentration
  sperm_conc_million_ml: number | string;
  total_sperm_count_million: number | string;

  // Morphology
  normal_forms_pct: number | string;
  head_defects_pct: number | string;
  midpiece_defects_pct: number | string;
  tail_defects_pct: number | string;

  // Vitality
  vitality_live_pct: number | string;

  // Additional Findings
  round_cells_million_ml: number | string;
  leukocytes_million_ml: number | string;
  agglutination: string;
  debris: string;
  fructose: string;

  // Advanced Fertilization
  hos_pct: number | string;
  acrosome_intactness: string;
  zona_binding_potential: string;

  // Comments & Signatures
  impression: string;
  analyzed_by: string;
  analyzed_date: string;
}

export interface NormalSemenAnalysisData {
  collection_date: string;
  abstinence_days: number | string;
  volume_ml: number | string;
  liquefaction_time_min: number | string;
  ph: number | string;
  pre_conc_million_ml: number | string;
  total_motility_pct: number | string;
  progressive_motility_pct: number | string;
  normal_forms_pct: number | string;
  dfi_total_pct: number | string;
  impression: string;
}

interface AndrologyDataEntryProps {
  patientId: string;
  patientName?: string;
  patientVid?: string;
  partnerName?: string;
  onUpdate?: () => void;
}

export default function AndrologyDataEntry({
  patientId,
  patientName,
  patientVid,
  partnerName,
  onUpdate,
}: AndrologyDataEntryProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'casa' | 'normal'>('casa');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);

  // 1. CASA Form State
  const [casaForm, setCasaForm] = useState<CasaSemenAnalysisData>({
    abstinence_days: '',
    collection_date: new Date().toISOString().split('T')[0],
    analysis_date: new Date().toISOString().split('T')[0],
    time_to_analysis_min: '',
    collection_place: '',
    referring_physician: '',

    volume_ml: '',
    liquefaction_time_min: '',
    appearance: '',
    ph: '',
    viscosity: '',

    total_motility_pct: '',
    rapid_progressive_grade_a: '',
    slow_progressive_grade_b: '',
    non_progressive_grade_c: '',
    immotile_grade_d: '',
    progressive_motility_pct: '',
    sperm_motility_index: '',

    sperm_conc_million_ml: '',
    total_sperm_count_million: '',

    normal_forms_pct: '',
    head_defects_pct: '',
    midpiece_defects_pct: '',
    tail_defects_pct: '',

    vitality_live_pct: '',

    round_cells_million_ml: '',
    leukocytes_million_ml: '',
    agglutination: '',
    debris: '',
    fructose: '',

    hos_pct: '',
    acrosome_intactness: '',
    zona_binding_potential: '',

    impression: '',
    analyzed_by: user?.name || '',
    analyzed_date: new Date().toISOString().split('T')[0],
  });

  // 2. Normal SA Form State (Retained & Preserved)
  const [normalForm, setNormalForm] = useState<NormalSemenAnalysisData>({
    collection_date: new Date().toISOString().split('T')[0],
    abstinence_days: '',
    volume_ml: '',
    liquefaction_time_min: '',
    ph: '',
    pre_conc_million_ml: '',
    total_motility_pct: '',
    progressive_motility_pct: '',
    normal_forms_pct: '',
    dfi_total_pct: '',
    impression: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [andrologyHistory, setAndrologyHistory] = useState<any[]>([]);

  // Auto-calculate Total Sperm Number when Volume or Concentration changes in CASA
  useEffect(() => {
    const vol = parseFloat(String(casaForm.volume_ml)) || 0;
    const conc = parseFloat(String(casaForm.sperm_conc_million_ml)) || 0;
    if (vol > 0 && conc > 0) {
      const total = (vol * conc).toFixed(1);
      setCasaForm((prev) => ({ ...prev, total_sperm_count_million: total }));
    }
  }, [casaForm.volume_ml, casaForm.sperm_conc_million_ml]);

  // Auto-calculate Progressive (A+B) in CASA
  useEffect(() => {
    const a = parseFloat(String(casaForm.rapid_progressive_grade_a)) || 0;
    const b = parseFloat(String(casaForm.slow_progressive_grade_b)) || 0;
    if (a > 0 || b > 0) {
      setCasaForm((prev) => ({ ...prev, progressive_motility_pct: a + b }));
    }
  }, [casaForm.rapid_progressive_grade_a, casaForm.slow_progressive_grade_b]);

  useEffect(() => {
    if (!patientId) return;
    andrologyApi.list({ patient_id: patientId }).then((andRes: any) => {
      if (andRes && andRes.length > 0) {
        setAndrologyHistory(andRes);
        const first = andRes[0];
        if (first.record_type === 'casa_semen_analysis' && first.data) {
          setCasaForm((prev) => ({ ...prev, ...first.data }));
          setActiveTab('casa');
        } else if (first.data) {
          setNormalForm((prev) => ({ ...prev, ...first.data }));
        }
      }
    }).catch((err) => console.error('Failed to load andrology data', err));
  }, [patientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !user) {
      alert('No valid patient or user to record andrology data.');
      return;
    }
    setIsSaving(true);
    try {
      const isCasa = activeTab === 'casa';
      await andrologyApi.create({
        patient_id: patientId,
        record_type: isCasa ? 'casa_semen_analysis' : 'routine_semen_analysis',
        data: isCasa ? casaForm : normalForm,
        created_by: user.id,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh history
      const freshHistory = await andrologyApi.list({ patient_id: patientId });
      if (freshHistory) setAndrologyHistory(freshHistory);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to save andrology report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                WHO 6th Edition (2021) Andrology Suite
              </span>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved successfully
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Semen Analysis Report: {patientName || 'Patient'}
            </h2>
            <p className="text-xs text-slate-500">
              Select CASA (Automated) or Routine / Normal Semen Analysis
            </p>
          </div>

          {/* Mode Switch & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('casa')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'casa'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>CASA (Computer-Assisted)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('normal')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'normal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Routine / Normal SA (Manual)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: CASA SEMEN ANALYSIS (Full WHO 6th Edition)         */}
        {/* ======================================================== */}
        {activeTab === 'casa' ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Patient Information / Sampling Details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                1. Patient &amp; Sampling Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                  <input
                    type="number"
                    value={casaForm.abstinence_days}
                    onChange={(e) => setCasaForm({ ...casaForm, abstinence_days: e.target.value })}
                    className="vmd-input text-xs w-full font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date of Collection</label>
                  <input
                    type="date"
                    value={casaForm.collection_date}
                    onChange={(e) => setCasaForm({ ...casaForm, collection_date: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date of Analysis</label>
                  <input
                    type="date"
                    value={casaForm.analysis_date}
                    onChange={(e) => setCasaForm({ ...casaForm, analysis_date: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Time to Analysis (min)</label>
                  <input
                    type="number"
                    value={casaForm.time_to_analysis_min}
                    onChange={(e) => setCasaForm({ ...casaForm, time_to_analysis_min: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Place of Collection</label>
                  <input
                    type="text"
                    value={casaForm.collection_place}
                    onChange={(e) => setCasaForm({ ...casaForm, collection_place: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. Clinic Collection Room"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Referring Physician</label>
                  <input
                    type="text"
                    value={casaForm.referring_physician}
                    onChange={(e) => setCasaForm({ ...casaForm, referring_physician: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. Dr. VaidyaMD"
                  />
                </div>
              </div>
            </div>

            {/* 2. Macroscopic Parameters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                2. Macroscopic Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-1">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Volume (mL)</span>
                    <span className="text-slate-400 font-normal">≥ 1.4</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={casaForm.volume_ml}
                    onChange={(e) => {
                      const vol = e.target.value;
                      const conc = casaForm.sperm_conc_million_ml;
                      const total = vol && conc ? (parseFloat(vol) * parseFloat(String(conc))).toFixed(1) : casaForm.total_sperm_count_million;
                      setCasaForm({ ...casaForm, volume_ml: vol, total_sperm_count_million: total });
                    }}
                    className="vmd-input text-xs w-full font-bold text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Liquefaction (min)</span>
                    <span className="text-slate-400 font-normal">&lt; 60</span>
                  </div>
                  <input
                    type="number"
                    value={casaForm.liquefaction_time_min}
                    onChange={(e) => setCasaForm({ ...casaForm, liquefaction_time_min: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Appearance</span>
                    <span className="text-slate-400 font-normal">Grey-opalescent</span>
                  </div>
                  <input
                    type="text"
                    value={casaForm.appearance}
                    onChange={(e) => setCasaForm({ ...casaForm, appearance: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>pH</span>
                    <span className="text-slate-400 font-normal">≥ 7.2</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={casaForm.ph}
                    onChange={(e) => setCasaForm({ ...casaForm, ph: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Viscosity</span>
                    <span className="text-slate-400 font-normal">Normal</span>
                  </div>
                  <select
                    value={casaForm.viscosity}
                    onChange={(e) => setCasaForm({ ...casaForm, viscosity: e.target.value })}
                    className="vmd-input text-xs w-full"
                  >
                    <option value="">Select Viscosity...</option>
                    <option>Normal</option>
                    <option>Slightly Viscous</option>
                    <option>Viscous</option>
                    <option>High Viscosity</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. CASA Motility Parameters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                3. CASA Motility Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 p-1">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Total Motility %</span>
                    <span className="text-slate-400 font-normal">≥ 42%</span>
                  </div>
                  <input
                    type="number"
                    value={casaForm.total_motility_pct}
                    onChange={(e) => {
                      const tot = e.target.value;
                      const imm = tot !== '' ? Math.max(0, 100 - parseFloat(tot)) : casaForm.immotile_grade_d;
                      setCasaForm({ ...casaForm, total_motility_pct: tot, immotile_grade_d: imm });
                    }}
                    className="vmd-input text-xs w-full font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rapid Prog (A) %</label>
                  <input
                    type="number"
                    value={casaForm.rapid_progressive_grade_a}
                    onChange={(e) => {
                      const a = parseFloat(e.target.value) || 0;
                      const b = parseFloat(String(casaForm.slow_progressive_grade_b)) || 0;
                      const c = parseFloat(String(casaForm.non_progressive_grade_c)) || 0;
                      const prog = a + b;
                      const tot = prog + c;
                      setCasaForm({
                        ...casaForm,
                        rapid_progressive_grade_a: e.target.value,
                        progressive_motility_pct: prog,
                        total_motility_pct: tot,
                        immotile_grade_d: Math.max(0, 100 - tot),
                      });
                    }}
                    className="vmd-input text-xs w-full font-semibold text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Slow Prog (B) %</label>
                  <input
                    type="number"
                    value={casaForm.slow_progressive_grade_b}
                    onChange={(e) => {
                      const a = parseFloat(String(casaForm.rapid_progressive_grade_a)) || 0;
                      const b = parseFloat(e.target.value) || 0;
                      const c = parseFloat(String(casaForm.non_progressive_grade_c)) || 0;
                      const prog = a + b;
                      const tot = prog + c;
                      setCasaForm({
                        ...casaForm,
                        slow_progressive_grade_b: e.target.value,
                        progressive_motility_pct: prog,
                        total_motility_pct: tot,
                        immotile_grade_d: Math.max(0, 100 - tot),
                      });
                    }}
                    className="vmd-input text-xs w-full font-semibold text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Non-Prog (C) %</label>
                  <input
                    type="number"
                    value={casaForm.non_progressive_grade_c}
                    onChange={(e) => {
                      const prog = parseFloat(String(casaForm.progressive_motility_pct)) || 0;
                      const c = parseFloat(e.target.value) || 0;
                      const tot = prog + c;
                      setCasaForm({
                        ...casaForm,
                        non_progressive_grade_c: e.target.value,
                        total_motility_pct: tot,
                        immotile_grade_d: Math.max(0, 100 - tot),
                      });
                    }}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Immotile (D) %</label>
                  <input
                    type="number"
                    value={casaForm.immotile_grade_d}
                    onChange={(e) => setCasaForm({ ...casaForm, immotile_grade_d: e.target.value })}
                    className="vmd-input text-xs w-full text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Prog (A+B) %</span>
                    <span className="text-slate-400 font-normal">≥ 30%</span>
                  </div>
                  <input
                    type="number"
                    value={casaForm.progressive_motility_pct}
                    onChange={(e) => setCasaForm({ ...casaForm, progressive_motility_pct: e.target.value })}
                    className="vmd-input text-xs w-full font-bold text-primary font-bold bg-blue-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Motility Index (SMI)</label>
                  <input
                    type="number"
                    value={casaForm.sperm_motility_index}
                    onChange={(e) => setCasaForm({ ...casaForm, sperm_motility_index: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. 180"
                  />
                </div>
              </div>
            </div>

            {/* 4. Concentration & 5. Morphology */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4. Concentration */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                  4. Concentration
                </h3>
                <div className="grid grid-cols-2 gap-3 p-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Sperm Conc (M/mL)</span>
                      <span className="text-slate-400 font-normal">≥ 16</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={casaForm.sperm_conc_million_ml}
                      onChange={(e) => {
                        const conc = e.target.value;
                        const vol = casaForm.volume_ml;
                        const total = vol && conc ? (parseFloat(String(vol)) * parseFloat(conc)).toFixed(1) : casaForm.total_sperm_count_million;
                        setCasaForm({ ...casaForm, sperm_conc_million_ml: conc, total_sperm_count_million: total });
                      }}
                      className="vmd-input text-xs w-full font-bold text-text-main"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Total Count (M/ejac)</span>
                      <span className="text-slate-400 font-normal">≥ 39</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={casaForm.total_sperm_count_million}
                      onChange={(e) => setCasaForm({ ...casaForm, total_sperm_count_million: e.target.value })}
                      className="vmd-input text-xs w-full font-bold text-text-main bg-primary/5"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Morphology */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                  5. Morphology
                </h3>
                <div className="grid grid-cols-4 gap-2 p-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Normal %</span>
                      <span className="text-slate-400 font-normal">≥ 4%</span>
                    </div>
                    <input
                      type="number"
                      value={casaForm.normal_forms_pct}
                      onChange={(e) => setCasaForm({ ...casaForm, normal_forms_pct: e.target.value })}
                      className="vmd-input text-xs w-full font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Head Defects %</label>
                    <input
                      type="number"
                      value={casaForm.head_defects_pct}
                      onChange={(e) => setCasaForm({ ...casaForm, head_defects_pct: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Midpiece %</label>
                    <input
                      type="number"
                      value={casaForm.midpiece_defects_pct}
                      onChange={(e) => setCasaForm({ ...casaForm, midpiece_defects_pct: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tail Defects %</label>
                    <input
                      type="number"
                      value={casaForm.tail_defects_pct}
                      onChange={(e) => setCasaForm({ ...casaForm, tail_defects_pct: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Vitality & 7. Additional Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 6. Vitality */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                  6. Vitality
                </h3>
                <div className="p-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Vitality (Live Sperm) (%)</span>
                    <span className="text-slate-400 font-normal">≥ 54%</span>
                  </div>
                  <input
                    type="number"
                    value={casaForm.vitality_live_pct}
                    onChange={(e) => setCasaForm({ ...casaForm, vitality_live_pct: e.target.value })}
                    className="vmd-input text-xs w-full font-bold text-emerald-800"
                    placeholder="≥ 54"
                  />
                </div>
              </div>

              {/* 7. Additional Findings */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                  7. Additional Findings
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Round Cells (M/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={casaForm.round_cells_million_ml}
                      onChange={(e) => setCasaForm({ ...casaForm, round_cells_million_ml: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Leukocytes (M/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={casaForm.leukocytes_million_ml}
                      onChange={(e) => setCasaForm({ ...casaForm, leukocytes_million_ml: e.target.value })}
                      className="vmd-input text-xs w-full"
                      placeholder="< 1.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Agglutination</label>
                    <select
                      value={casaForm.agglutination}
                      onChange={(e) => setCasaForm({ ...casaForm, agglutination: e.target.value })}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="">Select Agglutination...</option>
                      <option>Absent</option>
                      <option>Isolated</option>
                      <option>Moderate</option>
                      <option>Gross</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Debris</label>
                    <input
                      type="text"
                      value={casaForm.debris}
                      onChange={(e) => setCasaForm({ ...casaForm, debris: e.target.value })}
                      className="vmd-input text-xs w-full"
                      placeholder="e.g. Minimal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Fructose</label>
                    <select
                      value={casaForm.fructose}
                      onChange={(e) => setCasaForm({ ...casaForm, fructose: e.target.value })}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="">Select Fructose...</option>
                      <option>Positive (Present)</option>
                      <option>Negative (Absent)</option>
                      <option>Present</option>
                      <option>Absent</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Advanced Sperm Fertilization Parameters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                8. Advanced Sperm Fertilization Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>HOS (hypo-osmotic swelling)</span>
                    <span className="text-slate-400 font-normal">≥ 60%</span>
                  </div>
                  <input
                    type="number"
                    value={casaForm.hos_pct}
                    onChange={(e) => setCasaForm({ ...casaForm, hos_pct: e.target.value })}
                    className="vmd-input text-xs w-full font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Acrosome Intactness (AI)</label>
                  <input
                    type="text"
                    value={casaForm.acrosome_intactness}
                    onChange={(e) => setCasaForm({ ...casaForm, acrosome_intactness: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. Normal (>50%)"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Zona Binding Potential of Sperm</label>
                  <input
                    type="text"
                    value={casaForm.zona_binding_potential}
                    onChange={(e) => setCasaForm({ ...casaForm, zona_binding_potential: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. Adequate"
                  />
                </div>
              </div>
            </div>

            {/* 9. Interpretation / Comments & Signatures */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                9. Interpretation / Comments &amp; Signatures
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Interpretation / Comments</label>
                <textarea
                  rows={3}
                  value={casaForm.impression}
                  onChange={(e) => setCasaForm({ ...casaForm, impression: e.target.value })}
                  className="vmd-input text-xs w-full"
                  placeholder="Enter interpretation and comments..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Analyzed by / Signature</label>
                  <input
                    type="text"
                    value={casaForm.analyzed_by}
                    onChange={(e) => setCasaForm({ ...casaForm, analyzed_by: e.target.value })}
                    className="vmd-input text-xs w-full font-semibold text-slate-800"
                    placeholder="Laboratory Andrologist / Embryologist"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={casaForm.analyzed_date}
                    onChange={(e) => setCasaForm({ ...casaForm, analyzed_date: e.target.value })}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-md shadow-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving CASA Report...' : 'Save CASA Semen Analysis'}
            </button>
          </form>
        ) : (
          /* ======================================================== */
          /* TAB 2: ROUTINE / NORMAL SEMEN ANALYSIS (Manual Form)      */
          /* ======================================================== */
          <form onSubmit={handleSave} className="space-y-5">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 mb-4">
              <strong>Routine Semen Analysis:</strong> Standard manual laboratory protocol for rapid clinical assessment.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                <input
                  type="number"
                  value={normalForm.abstinence_days}
                  onChange={(e) => setNormalForm({ ...normalForm, abstinence_days: e.target.value })}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume (mL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={normalForm.volume_ml}
                  onChange={(e) => setNormalForm({ ...normalForm, volume_ml: e.target.value })}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Concentration (M/mL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={normalForm.pre_conc_million_ml}
                  onChange={(e) => setNormalForm({ ...normalForm, pre_conc_million_ml: e.target.value })}
                  className="vmd-input text-xs font-bold text-text-main w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive (PR) %</label>
                <input
                  type="number"
                  value={normalForm.progressive_motility_pct}
                  onChange={(e) => setNormalForm({ ...normalForm, progressive_motility_pct: e.target.value })}
                  className="vmd-input text-xs font-bold text-emerald-800 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility %</label>
                <input
                  type="number"
                  value={normalForm.total_motility_pct}
                  onChange={(e) => setNormalForm({ ...normalForm, total_motility_pct: e.target.value })}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Normal Forms % (Kruger)</label>
                <input
                  type="number"
                  value={normalForm.normal_forms_pct}
                  onChange={(e) => setNormalForm({ ...normalForm, normal_forms_pct: e.target.value })}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm DFI % (Halosperm)</label>
                <input
                  type="number"
                  value={normalForm.dfi_total_pct}
                  onChange={(e) => setNormalForm({ ...normalForm, dfi_total_pct: e.target.value })}
                  className="vmd-input text-xs font-bold text-violet-800 w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Liquefaction (min)</label>
                <input
                  type="number"
                  value={normalForm.liquefaction_time_min}
                  onChange={(e) => setNormalForm({ ...normalForm, liquefaction_time_min: e.target.value })}
                  className="vmd-input text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Impression</label>
              <input
                type="text"
                value={normalForm.impression}
                onChange={(e) => setNormalForm({ ...normalForm, impression: e.target.value })}
                className="vmd-input text-xs w-full"
                placeholder="Enter impression..."
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-md shadow-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Routine Semen Analysis'}
            </button>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* PREVIOUS ANDROLOGY RECORDS LIST                           */}
      {/* ======================================================== */}
      {andrologyHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-600" /> Previous Semen Analysis Reports
          </h3>
          <div className="space-y-3">
            {andrologyHistory.map((rec: any, idx: number) => {
              const isCasaRec = rec.record_type === 'casa_semen_analysis';
              return (
                <div key={rec.id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        isCasaRec ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isCasaRec ? 'CASA Analysis' : 'Routine SA'}
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {rec.data?.collection_date || new Date(rec.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.data?.impression?.toLowerCase().includes('normal')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {rec.data?.impression || 'Report on File'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] text-slate-700">
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">Volume</span>
                      <strong>{rec.data?.volume_ml ?? '—'} mL</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">Conc</span>
                      <strong>{rec.data?.sperm_conc_million_ml || rec.data?.pre_conc_million_ml || '—'} M/mL</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">Total Count</span>
                      <strong>{rec.data?.total_sperm_count_million || '—'} M</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">PR Motility</span>
                      <strong>{rec.data?.progressive_motility_pct ?? '—'}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">Normal Forms</span>
                      <strong>{rec.data?.normal_forms_pct ?? '—'}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px]">Vitality / DFI</span>
                      <strong>{rec.data?.vitality_live_pct ? `${rec.data.vitality_live_pct}% (Vit)` : (rec.data?.dfi_total_pct ? `${rec.data.dfi_total_pct}% (DFI)` : '—')}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STANDARDIZED PRINT REPORT MODAL (Matching HTML Template)   */}
      {/* ======================================================== */}
      {showPrintModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-12 sm:pt-16 pb-8 px-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:overflow-visible"
          style={{ background: 'rgba(0,0,0,0.65)' }}
        >
          <div className="bg-white max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 rounded-lg print:shadow-none print:rounded-none print:m-0 print:max-w-full print:border-none print:bg-transparent">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 gap-2 print:hidden bg-slate-900 text-white">
              <div>
                <p className="text-sm font-semibold">
                  {activeTab === 'casa' ? 'CASA Semen Analysis Preview' : 'Routine Semen Analysis Preview'}
                </p>
                <p className="text-xs opacity-60 mt-0.5">WHO 6th Edition lower reference standards</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setIncludeLetterhead(true)}
                    className={`px-2.5 py-1 rounded transition-colors font-medium ${
                      includeLetterhead ? 'bg-[rgb(var(--clr-primary))] text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    With Header
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeLetterhead(false)}
                    className={`px-2.5 py-1 rounded transition-colors font-medium ${
                      !includeLetterhead ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Use for pre-printed letterhead pads"
                  >
                    Pre-printed Pad
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: 'rgb(var(--clr-primary))', color: 'white' }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print (A4)
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-1 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 printable-document print:p-6 text-slate-900 text-xs" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <PrintableReportHeader
                title={activeTab === 'casa' ? 'CASA SEMEN ANALYSIS REPORT' : 'ROUTINE SEMEN ANALYSIS REPORT'}
                subtitle="Computer-Assisted Sperm Analysis — Laboratory Diagnostic Report"
                badge="WHO 6th ED (2021)"
                includeHeader={includeLetterhead}
                department="Department of Andrology & Reproductive Biology"
                patient={{
                  name: patientName || 'Male Patient',
                  vid: patientVid,
                }}
                partner={partnerName ? { name: partnerName } : undefined}
                metaFields={[
                  { label: 'Abstinence', value: `${activeTab === 'casa' ? casaForm.abstinence_days : normalForm.abstinence_days} Days` },
                  { label: 'Collection Date', value: activeTab === 'casa' ? casaForm.collection_date : normalForm.collection_date },
                ]}
              />

              {activeTab === 'casa' ? (
                <>
                  {/* 1. Patient Information (Inheriting directly from Patient Context) */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Patient Information
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900 w-[42%]">Patient Name / ID</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 w-[58%]" colSpan={2}>
                            {patientName || 'Patient'} {patientVid ? `· ID: ${patientVid}` : ''}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Period of Abstinence</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.abstinence_days} Days</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Date of Collection</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.collection_date || '—'}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Date of Analysis</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.analysis_date || '—'}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Time to Analysis from Collection (min)</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.time_to_analysis_min || '—'} min</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Place of Collection</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.collection_place || '—'}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8] text-slate-900">Referring Physician</td>
                          <td className="py-1.5 px-3 text-slate-800" colSpan={2}>{casaForm.referring_physician || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Macroscopic Parameters */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Macroscopic Parameters
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Volume (mL)</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{casaForm.volume_ml || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 1.4</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Liquefaction Time (min)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.liquefaction_time_min || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">&lt; 60</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Appearance</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.appearance || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">Grey-opalescent</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">pH</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.ph || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 7.2</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Viscosity</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.viscosity || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">Normal</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. CASA Motility Parameters */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      CASA Motility Parameters
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Total Motility (%)</td>
                          <td className="py-1.5 px-3 font-bold text-emerald-800">{casaForm.total_motility_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 42</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Rapid progressive — grade A</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.rapid_progressive_grade_a}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Slow, progressive — grade B</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.slow_progressive_grade_b}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Non-progressive — grade C</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.non_progressive_grade_c}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Immotile — grade D</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.immotile_grade_d}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Progressive (A+B) (%)</td>
                          <td className="py-1.5 px-3 font-bold text-primary font-bold">{casaForm.progressive_motility_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 30</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Sperm Motility Index (SMI)</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{casaForm.sperm_motility_index || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4. Concentration */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Concentration
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Sperm Concentration (million/mL)</td>
                          <td className="py-1.5 px-3 font-bold text-text-main">{casaForm.sperm_conc_million_ml || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 16</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Total Sperm Number (million/ejaculate)</td>
                          <td className="py-1.5 px-3 font-bold text-text-main">{casaForm.total_sperm_count_million || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 39</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 5. Morphology */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Morphology
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Normal Forms (%)</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{casaForm.normal_forms_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 4</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Head Defects (%)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.head_defects_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Midpiece Defects (%)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.midpiece_defects_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Tail Defects (%)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.tail_defects_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 6. Vitality */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Vitality
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Vitality (Live Sperm) (%)</td>
                          <td className="py-1.5 px-3 font-bold text-emerald-800">{casaForm.vitality_live_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 54</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 7. Additional Findings */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Additional Findings
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Round Cells (million/mL)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.round_cells_million_ml || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Leukocytes (million/mL)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.leukocytes_million_ml || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">&lt; 1.0</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Agglutination</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.agglutination || 'Absent'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">Absent</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Debris</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.debris || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Fructose</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.fructose || 'Present'}</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">Present</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 8. Advanced Sperm Fertilization Parameters */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Advanced Sperm Fertilization Parameters
                    </h3>
                    <table className="w-full text-xs border border-slate-300 border-t-0 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left w-[42%]">Parameter</th>
                          <th className="py-1.5 px-3 text-left w-[38%]">Result</th>
                          <th className="py-1.5 px-3 text-left w-[20%]">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">HOS (hypo-osmotic swelling)</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">{casaForm.hos_pct}%</td>
                          <td className="py-1.5 px-3 text-slate-500 bg-[#fafbfc]">≥ 60%</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Acrosome Intactness (AI)</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.acrosome_intactness || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 font-semibold bg-[#eef3f8]">Zona Binding Potential of Sperm</td>
                          <td className="py-1.5 px-3 text-slate-800">{casaForm.zona_binding_potential || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-400 bg-[#fafbfc]">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 9. Interpretation / Comments */}
                  <div className="space-y-1 avoid-break">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white bg-[#1a3a5c] px-3 py-1 rounded-t">
                      Interpretation / Comments
                    </h3>
                    <div className="border border-slate-300 border-t-0 p-3 min-h-[75px] bg-white">
                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {casaForm.impression || 'No abnormal findings reported. Microscopic parameters correspond to WHO 6th edition reference limits.'}
                      </p>
                    </div>
                  </div>

                  {/* Sign-row: Analyzed by / Signature and Date */}
                  <div className="pt-6 grid grid-cols-2 gap-10 text-xs avoid-break">
                    <div>
                      <div className="border-b border-slate-800 h-6 mb-1 flex items-end">
                        <span className="font-serif italic font-bold text-slate-800">{casaForm.analyzed_by}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Analyzed by / Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-800 h-6 mb-1 flex items-end">
                        <span className="font-mono text-xs text-slate-800">{casaForm.analyzed_date || new Date().toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Date</p>
                    </div>
                  </div>

                  {/* Footnote Note */}
                  <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 text-left italic">
                    Reference ranges shown reflect WHO 6th edition (2021) lower reference limits where applicable. Ranges are indicative — confirm against your laboratory&apos;s validated values.
                  </div>
                </>
              ) : (
                /* Routine SA Print Table */
                <div className="space-y-1.5 avoid-break">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-300">
                    Semen Analysis Parameters
                  </h3>
                  <table className="w-full text-xs border-collapse print-table">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                        <th className="py-1.5 px-3 w-1/2">Parameter</th>
                        <th className="py-1.5 px-3 w-1/4">Result</th>
                        <th className="py-1.5 px-3 w-1/4">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="py-1.5 px-3 font-semibold">Volume (mL)</td><td className="py-1.5 px-3 font-bold">{normalForm.volume_ml || '—'}</td><td className="py-1.5 px-3 text-slate-500">≥ 1.4</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Concentration (million/mL)</td><td className="py-1.5 px-3 font-bold">{normalForm.pre_conc_million_ml || '—'}</td><td className="py-1.5 px-3 text-slate-500">≥ 16</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Progressive Motility (PR) (%)</td><td className="py-1.5 px-3 font-bold text-primary font-bold">{normalForm.progressive_motility_pct || '—'}%</td><td className="py-1.5 px-3 text-slate-500">≥ 30%</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Total Motility (PR + NP) (%)</td><td className="py-1.5 px-3 font-bold text-emerald-800">{normalForm.total_motility_pct || '—'}%</td><td className="py-1.5 px-3 text-slate-500">≥ 42%</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Normal Forms (Kruger) (%)</td><td className="py-1.5 px-3 font-bold">{normalForm.normal_forms_pct || '—'}%</td><td className="py-1.5 px-3 text-slate-500">≥ 4%</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Sperm DNA Fragmentation (DFI) (%)</td><td className="py-1.5 px-3 font-bold text-violet-800">{normalForm.dfi_total_pct || '—'}%</td><td className="py-1.5 px-3 text-slate-500">&lt; 15% (Normal)</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">Liquefaction Time (min)</td><td className="py-1.5 px-3">{normalForm.liquefaction_time_min || '—'}</td><td className="py-1.5 px-3 text-slate-500">&lt; 60</td></tr>
                      <tr><td className="py-1.5 px-3 font-semibold">pH</td><td className="py-1.5 px-3">{normalForm.ph || '—'}</td><td className="py-1.5 px-3 text-slate-500">≥ 7.2</td></tr>
                    </tbody>
                  </table>

                  {/* Diagnostic Impression */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 avoid-break mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Interpretation &amp; Clinical Comments</span>
                    <p className="text-xs font-semibold text-slate-800">
                      {normalForm.impression || 'No specific pathological abnormality detected.'}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs avoid-break">
                    <div>
                      <div className="border-b border-slate-400 w-48 mb-1" />
                      <p className="font-bold text-slate-800">{casaForm.analyzed_by || 'Chief Andrologist'}</p>
                      <p className="text-[10px] text-slate-500">Laboratory Andrologist / Embryologist</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="border-b border-slate-400 w-48 mb-1" />
                      <p className="font-bold text-slate-800">Consultant Gynaecologist / ART Specialist</p>
                      <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Footer WHO Reference Note */}
                  <div className="text-[9px] text-slate-400 border-t border-slate-200 pt-2 text-center">
                    Reference ranges shown reflect WHO 6th edition (2021) lower reference limits. Values are indicative and should be interpreted by your treating reproductive specialist.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
