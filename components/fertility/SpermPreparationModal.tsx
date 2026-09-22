'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
  Microscope,
} from 'lucide-react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import { andrologyApi } from '@/lib/api';

export interface SpermPreparationModalProps {
  patient: any;
  partner?: any;
  cycle?: any;
  activeCycle?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SpermPreparationModal({
  patient,
  partner,
  cycle,
  activeCycle,
  onClose,
  onSaved,
}: SpermPreparationModalProps) {
  const resolvedCycle = activeCycle || cycle;
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Top Metadata
  const [reportType, setReportType] = useState('IUI');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfCollection, setTimeOfCollection] = useState('');
  const [timeOfDispatch, setTimeOfDispatch] = useState('');
  const [iuiDate, setIuiDate] = useState(new Date().toISOString().split('T')[0]);
  const [abstinenceDays, setAbstinenceDays] = useState('');

  // Pre-Process Fields
  const [preVolume, setPreVolume] = useState('');
  const [preLiquefaction, setPreLiquefaction] = useState('');
  const [prePh, setPrePh] = useState('');
  const [preViscosity, setPreViscosity] = useState('');
  const [preSampleType, setPreSampleType] = useState('Fresh');
  const [preBalanceVial, setPreBalanceVial] = useState('');
  const [preSpermConc, setPreSpermConc] = useState('');
  const [preTotalMotility, setPreTotalMotility] = useState('');
  const [preTotalSpermCount, setPreTotalSpermCount] = useState('');
  const [preSpermAbnormality, setPreSpermAbnormality] = useState('');
  const [preMorphology, setPreMorphology] = useState('');
  const [preProgression, setPreProgression] = useState('');
  const [preGradeA, setPreGradeA] = useState('');
  const [preGradeB, setPreGradeB] = useState('');
  const [preGradeC, setPreGradeC] = useState('');
  const [preGradeD, setPreGradeD] = useState('');
  const [preAbnormalForms, setPreAbnormalForms] = useState('');
  const [preEpithelialCell, setPreEpithelialCell] = useState('');
  const [prePusCells, setPrePusCells] = useState('');
  const [preRoundCells, setPreRoundCells] = useState('');
  const [preAggregation, setPreAggregation] = useState('');
  const [preAgglutination, setPreAgglutination] = useState('');

  // Post-Process Fields
  const [postPrepMethod, setPostPrepMethod] = useState('');
  const [postVolumePrepared, setPostVolumePrepared] = useState('');
  const [postRecoveryWith, setPostRecoveryWith] = useState('');
  const [postExpDate, setPostExpDate] = useState('');
  const [postSpermConc, setPostSpermConc] = useState('');
  const [postTotalMotility, setPostTotalMotility] = useState('');
  const [postTotalMotileSperm, setPostTotalMotileSperm] = useState(''); // TMSI
  const [postProgression, setPostProgression] = useState('');
  const [postGradeA, setPostGradeA] = useState('');
  const [postGradeB, setPostGradeB] = useState('');
  const [postGradeC, setPostGradeC] = useState('');
  const [postGradeD, setPostGradeD] = useState('');
  const [postAbnormalForms, setPostAbnormalForms] = useState('');
  const [postEmbryologist1, setPostEmbryologist1] = useState('');
  const [postIuiBp, setPostIuiBp] = useState('');
  const [postIuiPulse, setPostIuiPulse] = useState('');
  const [postImpression, setPostImpression] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [adviceAfterIui, setAdviceAfterIui] = useState('');

  // Auto calculate Total Motile Sperm Inseminated (TMSI)
  const calculateTMSI = (vol: string, conc: string, mot: string) => {
    const v = parseFloat(vol) || 0;
    const c = parseFloat(conc) || 0;
    const m = parseFloat(mot) || 0;
    if (v > 0 && c > 0 && m > 0) {
      const tmsi = v * c * (m / 100);
      setPostTotalMotileSperm(tmsi.toFixed(2));
    }
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'sperm_preparation',
        data: {
          report_type: reportType,
          collection_date: collectionDate,
          time_of_collection: timeOfCollection,
          time_of_dispatch: timeOfDispatch,
          iui_date: iuiDate,
          abstinence_days: parseInt(abstinenceDays, 10) || 0,
          pre: {
            volume_ml: parseFloat(preVolume) || 0,
            liquefaction: preLiquefaction,
            ph: parseFloat(prePh) || 0,
            viscosity: preViscosity,
            sample_type: preSampleType,
            balance_vial: preBalanceVial,
            sperm_conc_million_ml: parseFloat(preSpermConc) || 0,
            total_motility_pct: parseFloat(preTotalMotility) || 0,
            total_sperm_count_million: parseFloat(preTotalSpermCount) || 0,
            sperm_abnormality: preSpermAbnormality,
            morphology_pct: parseFloat(preMorphology) || 0,
            progression: preProgression,
            grade_a_pct: parseFloat(preGradeA) || 0,
            grade_b_pct: parseFloat(preGradeB) || 0,
            grade_c_pct: parseFloat(preGradeC) || 0,
            grade_d_pct: parseFloat(preGradeD) || 0,
            abnormal_forms_pct: parseFloat(preAbnormalForms) || 0,
            epithelial_cell: preEpithelialCell,
            pus_cells: prePusCells,
            round_cells: preRoundCells,
            aggregation: preAggregation,
            agglutination: preAgglutination,
          },
          post: {
            preparation_method: postPrepMethod,
            volume_prepared_ml: parseFloat(postVolumePrepared) || 0,
            recovery_media: postRecoveryWith,
            exp_date: postExpDate,
            sperm_conc_million_ml: parseFloat(postSpermConc) || 0,
            total_motility_pct: parseFloat(postTotalMotility) || 0,
            total_motile_sperm_million: parseFloat(postTotalMotileSperm) || 0,
            progression: postProgression,
            grade_a_pct: parseFloat(postGradeA) || 0,
            grade_b_pct: parseFloat(postGradeB) || 0,
            grade_c_pct: parseFloat(postGradeC) || 0,
            grade_d_pct: parseFloat(postGradeD) || 0,
            abnormal_forms_pct: parseFloat(postAbnormalForms) || 0,
            embryologist_1: postEmbryologist1,
            iui_bp: postIuiBp,
            iui_pulse: postIuiPulse,
            impression: postImpression,
            interpretation: interpretation,
            advice_after_iui: adviceAfterIui,
          },
          cycle_id: activeCycle?.id || null,
        },
      };

      await andrologyApi.create(payload);
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save sperm preparation record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-rail-bg/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-transparent print:overflow-visible">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:border-none print:bg-transparent print:m-0 print:p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Semen Analysis &amp; Sperm Preparation Report
              </h2>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patient?.name || 'Male Patient'}</span> ({patient?.vid || 'VID-000'})
                {activeCycle && ` · Cycle: ${activeCycle.cycle_id}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form Entry
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Report
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* Report Type & Global Meta */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Report Type / Intended Use</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="vmd-input text-xs font-semibold"
                  >
                    <option value="IUI">Intrauterine Insemination (IUI)</option>
                    <option value="IVF">Standard IVF Insemination</option>
                    <option value="ICSI">Intracytoplasmic Sperm Injection (ICSI)</option>
                    <option value="Diagnostic">Diagnostic Semen Wash Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date of Collection</label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Collection Time</label>
                  <input
                    type="time"
                    value={timeOfCollection}
                    onChange={(e) => setTimeOfCollection(e.target.value)}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Abstinence (Days)</label>
                  <input
                    type="number"
                    value={abstinenceDays}
                    onChange={(e) => setAbstinenceDays(e.target.value)}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              {/* Section 1: Pre-Process Report */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-slate-700 text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                  <span>1. Semen Pre-Process Report (Raw Specimen)</span>
                  <span className="text-[10px] font-normal text-slate-200">Baseline Diagnostics</span>
                </div>
                <div className="p-4 bg-white space-y-4">
                  {/* Physical & Macroscopic */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Raw Volume (mL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={preVolume}
                        onChange={(e) => setPreVolume(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Liquefaction</label>
                      <input
                        type="text"
                        value={preLiquefaction}
                        onChange={(e) => setPreLiquefaction(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">pH</label>
                      <input
                        type="number"
                        step="0.1"
                        value={prePh}
                        onChange={(e) => setPrePh(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Viscosity</label>
                      <select
                        value={preViscosity}
                        onChange={(e) => setPreViscosity(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select Viscosity...</option>
                        <option value="Normal">Normal</option>
                        <option value="Slightly Viscous">Slightly Viscous</option>
                        <option value="Hyperviscous (>2cm thread)">Hyperviscous</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Sample Type</label>
                      <select
                        value={preSampleType}
                        onChange={(e) => setPreSampleType(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="Fresh">Fresh Ejaculate</option>
                        <option value="Frozen">Frozen-Thawed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Pre-Wash Conc (M/mL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={preSpermConc}
                        onChange={(e) => setPreSpermConc(e.target.value)}
                        className="vmd-input text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility (%)</label>
                      <input
                        type="number"
                        value={preTotalMotility}
                        onChange={(e) => setPreTotalMotility(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Count (M/ejac)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={preTotalSpermCount}
                        onChange={(e) => setPreTotalSpermCount(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Pre-wash Motility & Cell details */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rapid (Grade A %)</label>
                      <input
                        type="number"
                        value={preGradeA}
                        onChange={(e) => setPreGradeA(e.target.value)}
                        className="vmd-input text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Slow (Grade B %)</label>
                      <input
                        type="number"
                        value={preGradeB}
                        onChange={(e) => setPreGradeB(e.target.value)}
                        className="vmd-input text-xs text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Non-Prog (Grade C %)</label>
                      <input
                        type="number"
                        value={preGradeC}
                        onChange={(e) => setPreGradeC(e.target.value)}
                        className="vmd-input text-xs text-amber-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Immotile (Grade D %)</label>
                      <input
                        type="number"
                        value={preGradeD}
                        onChange={(e) => setPreGradeD(e.target.value)}
                        className="vmd-input text-xs text-rose-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Morphology (% Normal)</label>
                      <input
                        type="number"
                        value={preMorphology}
                        onChange={(e) => setPreMorphology(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Epithelial Cells</label>
                      <input
                        type="text"
                        value={preEpithelialCell}
                        onChange={(e) => setPreEpithelialCell(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Pus Cells (/HPF)</label>
                      <input
                        type="text"
                        value={prePusCells}
                        onChange={(e) => setPrePusCells(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Round Cells (/HPF)</label>
                      <input
                        type="text"
                        value={preRoundCells}
                        onChange={(e) => setPreRoundCells(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Agglutination</label>
                      <input
                        type="text"
                        value={preAgglutination}
                        onChange={(e) => setPreAgglutination(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Post-Process Report */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-[rgb(var(--clr-primary))] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                  <span>2. Semen Post-Process Report (Gradient / Swim-up Wash)</span>
                  <span className="text-[10px] font-normal text-white/80">Insemination Grade</span>
                </div>
                <div className="p-4 bg-white space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Preparation Method</label>
                      <select
                        value={postPrepMethod}
                        onChange={(e) => setPostPrepMethod(e.target.value)}
                        className="vmd-input text-xs font-semibold"
                      >
                        <option value="">Select Preparation Method...</option>
                        <option value="Density Gradient Centrifugation (DGC 45%/90%)">Density Gradient Centrifugation (DGC 45%/90%)</option>
                        <option value="Direct Swim-Up from Pellet">Direct Swim-Up from Pellet</option>
                        <option value="Double Wash & Centrifugation">Double Wash &amp; Centrifugation</option>
                        <option value="Microfluidic Sperm Sorting (Zymōt)">Microfluidic Sperm Sorting (Zymōt)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume Prepared (mL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={postVolumePrepared}
                        onChange={(e) => {
                          setPostVolumePrepared(e.target.value);
                          calculateTMSI(e.target.value, postSpermConc, postTotalMotility);
                        }}
                        className="vmd-input text-xs font-bold text-[rgb(var(--clr-primary))]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Recovery Media Used</label>
                      <input
                        type="text"
                        value={postRecoveryWith}
                        onChange={(e) => setPostRecoveryWith(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-Wash Conc (M/mL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={postSpermConc}
                        onChange={(e) => {
                          setPostSpermConc(e.target.value);
                          calculateTMSI(postVolumePrepared, e.target.value, postTotalMotility);
                        }}
                        className="vmd-input text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility (%)</label>
                      <input
                        type="number"
                        value={postTotalMotility}
                        onChange={(e) => {
                          setPostTotalMotility(e.target.value);
                          calculateTMSI(postVolumePrepared, postSpermConc, e.target.value);
                        }}
                        className="vmd-input text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <div className="sm:col-span-2 bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          TMSI (Total Motile Sperm Inseminated)
                        </span>
                        <p className="text-[11px] text-emerald-700">Vol × Conc × Motility %</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-800">{postTotalMotileSperm}</span>
                        <span className="text-xs font-bold text-emerald-700 ml-1">Million</span>
                      </div>
                    </div>
                  </div>

                  {/* Post-wash Motility grades */}
                  <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rapid (Grade A %)</label>
                      <input
                        type="number"
                        value={postGradeA}
                        onChange={(e) => setPostGradeA(e.target.value)}
                        className="vmd-input text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Slow (Grade B %)</label>
                      <input
                        type="number"
                        value={postGradeB}
                        onChange={(e) => setPostGradeB(e.target.value)}
                        className="vmd-input text-xs text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Non-Prog (Grade C %)</label>
                      <input
                        type="number"
                        value={postGradeC}
                        onChange={(e) => setPostGradeC(e.target.value)}
                        className="vmd-input text-xs text-amber-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Immotile (Grade D %)</label>
                      <input
                        type="number"
                        value={postGradeD}
                        onChange={(e) => setPostGradeD(e.target.value)}
                        className="vmd-input text-xs text-rose-700"
                      />
                    </div>
                  </div>

                  {/* IUI Vitals & Advice */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryologist / Analyst</label>
                      <input
                        type="text"
                        value={postEmbryologist1}
                        onChange={(e) => setPostEmbryologist1(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-IUI BP</label>
                      <input
                        type="text"
                        value={postIuiBp}
                        onChange={(e) => setPostIuiBp(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-IUI Pulse</label>
                      <input
                        type="text"
                        value={postIuiPulse}
                        onChange={(e) => setPostIuiPulse(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Impression &amp; Interpretation</label>
                    <textarea
                      rows={2}
                      value={postImpression}
                      onChange={(e) => setPostImpression(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Advice After IUI</label>
                    <textarea
                      rows={2}
                      value={adviceAfterIui}
                      onChange={(e) => setAdviceAfterIui(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Print Preview */
            <div className="max-w-4xl mx-auto bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800 printable-document print:p-0 print:m-0 print:border-none print:shadow-none">
              <PrintableReportHeader
                title="Semen Analysis & Sperm Preparation Report"
                subtitle="VaidyaMD Fertility & Andrology Laboratory · Sparta Clinical Suite"
                badge="SPERM PREP REPORT"
                patient={{
                  name: patient?.name || 'Male Patient',
                  vid: patient?.vid,
                }}
                partner={partner?.name ? { name: partner.name } : undefined}
                metaFields={[
                  { label: 'Report Type', value: reportType },
                  { label: 'Date of Collection', value: `${collectionDate} ${timeOfCollection}` },
                ]}
              />

              {/* Patient header table */}
              <div className="grid grid-cols-2 text-xs border border-slate-200 divide-x divide-y divide-slate-200 avoid-break">
                <div className="p-2.5 bg-slate-50 font-bold">Patient Name: <span className="font-normal">{patient?.name}</span></div>
                <div className="p-2.5 bg-slate-50 font-bold">Patient VID: <span className="font-normal font-mono">{patient?.vid}</span></div>
                <div className="p-2.5">Date of Collection: <span className="font-semibold">{collectionDate} {timeOfCollection}</span></div>
                <div className="p-2.5">Report Type: <span className="font-semibold">{reportType}</span></div>
                <div className="p-2.5">Abstinence: <span className="font-semibold">{abstinenceDays} Days</span></div>
                <div className="p-2.5">Sample Type: <span className="font-semibold">{preSampleType}</span></div>
              </div>

              {/* Comparison Table */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Pre-Wash vs. Post-Wash Comparative Analysis</h3>
                <table className="w-full text-xs border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border border-slate-300">Parameter</th>
                      <th className="p-2 border border-slate-300">Pre-Process (Raw)</th>
                      <th className="p-2 border border-slate-300">Post-Process (Inseminate)</th>
                      <th className="p-2 border border-slate-300">Reference Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Volume (mL)</td>
                      <td className="p-2 border border-slate-300">{preVolume}</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{postVolumePrepared}</td>
                      <td className="p-2 border border-slate-300 text-slate-500">≥ 1.4 mL</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Concentration (M/mL)</td>
                      <td className="p-2 border border-slate-300">{preSpermConc}</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{postSpermConc}</td>
                      <td className="p-2 border border-slate-300 text-slate-500">≥ 16 M/mL</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Total Motility (%)</td>
                      <td className="p-2 border border-slate-300">{preTotalMotility}%</td>
                      <td className="p-2 border border-slate-300 font-bold text-emerald-700">{postTotalMotility}%</td>
                      <td className="p-2 border border-slate-300 text-slate-500">≥ 42%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Grade A (Rapid Progressive)</td>
                      <td className="p-2 border border-slate-300">{preGradeA}%</td>
                      <td className="p-2 border border-slate-300 font-bold text-emerald-700">{postGradeA}%</td>
                      <td className="p-2 border border-slate-300 text-slate-500">—</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Grade B (Slow Progressive)</td>
                      <td className="p-2 border border-slate-300">{preGradeB}%</td>
                      <td className="p-2 border border-slate-300">{postGradeB}%</td>
                      <td className="p-2 border border-slate-300 text-slate-500">—</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Grade C (Non-Progressive)</td>
                      <td className="p-2 border border-slate-300">{preGradeC}%</td>
                      <td className="p-2 border border-slate-300">{postGradeC}%</td>
                      <td className="p-2 border border-slate-300 text-slate-500">—</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Grade D (Immotile)</td>
                      <td className="p-2 border border-slate-300">{preGradeD}%</td>
                      <td className="p-2 border border-slate-300">{postGradeD}%</td>
                      <td className="p-2 border border-slate-300 text-slate-500">—</td>
                    </tr>
                    <tr className="bg-emerald-50/50 font-bold">
                      <td className="p-2 border border-slate-300 text-emerald-900">TMSI (Total Motile Sperm)</td>
                      <td className="p-2 border border-slate-300 text-slate-500">—</td>
                      <td className="p-2 border border-slate-300 text-emerald-800 text-sm">{postTotalMotileSperm} M</td>
                      <td className="p-2 border border-slate-300 text-emerald-700">Target &gt; 10 M</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Method and Impression */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold">Preparation Method:</span> {postPrepMethod} · <span className="font-bold">Media:</span> {postRecoveryWith}
                </div>
                <div>
                  <span className="font-bold">Diagnostic Impression:</span>
                  <p className="mt-1 text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {postImpression}
                  </p>
                </div>
                <div>
                  <span className="font-bold">Advice After IUI:</span>
                  <p className="mt-1 text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {adviceAfterIui}
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{postEmbryologist1}</p>
                  <p className="text-slate-500">Andrologist / Embryologist</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">Date: {iuiDate}</p>
                  <p className="text-slate-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sperm preparation report saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Sperm Preparation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
