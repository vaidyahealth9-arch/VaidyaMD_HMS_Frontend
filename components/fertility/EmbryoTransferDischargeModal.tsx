'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Pill,
  Heart,
  Baby,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { treatmentCyclesApi } from '@/lib/api';

export interface EmbryoTransferDischargeModalProps {
  cycle: any;
  patient: any;
  partner?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EmbryoTransferDischargeModal({
  cycle,
  patient,
  partner,
  onClose,
  onSaved,
}: EmbryoTransferDischargeModalProps) {
  const existingSummary = cycle?.et_discharge_summary || {};
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Transfer Procedure Details
  const [transferType, setTransferType] = useState(
    existingSummary.transfer_type || (cycle?.treatment_type?.includes('FET') ? 'FET' : 'Fresh ET')
  );
  const [transferDate, setTransferDate] = useState(
    existingSummary.transfer_date || new Date().toISOString().split('T')[0]
  );
  const [catheterType, setCatheterType] = useState(
    existingSummary.catheter_type || 'Cook Sydney IVF Catheter'
  );
  const [ultrasoundGuidance, setUltrasoundGuidance] = useState(
    existingSummary.ultrasound_guidance || 'Transabdominal (Full Bladder)'
  );
  const [bloodOnCatheter, setBloodOnCatheter] = useState<string>(
    existingSummary.blood_on_catheter || 'None (Clean Catheter)'
  );
  const [retainedEmbryoChecked, setRetainedEmbryoChecked] = useState(
    existingSummary.retained_embryo_checked !== undefined ? existingSummary.retained_embryo_checked : false
  );
  const [embryosTransferredCount, setEmbryosTransferredCount] = useState<number | string>(
    existingSummary.embryos_transferred_count !== undefined ? existingSummary.embryos_transferred_count : ''
  );
  const [embryoStage, setEmbryoStage] = useState(
    existingSummary.embryo_stage || cycle?.sentinel_dates?.embryo_stage || 'Day 5 Blastocyst'
  );
  const [embryoGrades, setEmbryoGrades] = useState(
    existingSummary.embryo_grades?.join(', ') || ''
  );

  // Attending Staff & Witness
  const [attendingDoctorName, setAttendingDoctorName] = useState(
    existingSummary.attending_doctor_name || cycle?.doctor_name || cycle?.treating_doctor_name || ''
  );
  const [witnessEmbryologistName, setWitnessEmbryologistName] = useState(
    existingSummary.witness_embryologist_name || ''
  );

  // Luteal Phase Support Prescriptions
  const DEFAULT_LUTEAL_MEDS = [
    { drug: 'Cap. Susten (Micronized Progesterone)', dose: '400 mg', route: 'Vaginal', frequency: 'BD (Twice Daily)', instructions: 'Insert deep vaginally before bedtime & morning' },
    { drug: 'Tab. Progynova (Estradiol Valerate)', dose: '2 mg', route: 'Oral', frequency: 'TDS (Three Times Daily)', instructions: 'After meals' },
    { drug: 'Tab. Ecospirin (Aspirin)', dose: '75 mg', route: 'Oral', frequency: 'OD (Once Daily)', instructions: 'After lunch' },
    { drug: 'Tab. Folvite (Folic Acid)', dose: '5 mg', route: 'Oral', frequency: 'OD (Once Daily)', instructions: 'Morning' },
  ];

  const [medications, setMedications] = useState<any[]>(
    existingSummary.luteal_support_medications || DEFAULT_LUTEAL_MEDS
  );

  // Follow-up Timer (Beta-hCG)
  const defaultBetaDate = cycle?.sentinel_dates?.beta_hcg_date || (transferDate ? new Date(new Date(transferDate).getTime() + 14 * 86400000).toISOString().split('T')[0] : '');
  const [betaHcgDueDate, setBetaHcgDueDate] = useState(
    existingSummary.beta_hcg_due_date || defaultBetaDate
  );
  const [dischargeNotes, setDischargeNotes] = useState(
    existingSummary.discharge_notes || ''
  );

  const handleSave = async () => {
    if (!cycle?.id) return;
    if (!retainedEmbryoChecked) {
      alert('Mandatory safety check: You must verify that the catheter was checked and no retained embryos were present.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        transfer_type: transferType,
        transfer_date: transferDate,
        catheter_type: catheterType,
        ultrasound_guidance: ultrasoundGuidance,
        blood_on_catheter: bloodOnCatheter,
        retained_embryo_checked: retainedEmbryoChecked,
        embryos_transferred_count: Number(embryosTransferredCount),
        embryo_stage: embryoStage,
        embryo_grades: embryoGrades.split(',').map((s: string) => s.trim()).filter(Boolean),
        attending_doctor_name: attendingDoctorName,
        witness_embryologist_name: witnessEmbryologistName,
        luteal_support_medications: medications,
        beta_hcg_due_date: betaHcgDueDate,
        discharge_notes: dischargeNotes,
      };

      await treatmentCyclesApi.updateEtDischarge(cycle.id, payload);
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save ET discharge summary:', err);
      alert(err.message || 'Failed to save discharge summary');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70  z-50 flex items-center justify-center p-3 sm:p-6 print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Embryo Transfer Discharge Protocol</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300">
                  {transferType}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Patient: <strong>{patient?.name || 'Female Patient'}</strong> ({patient?.vid}) · Cycle: <strong className="font-mono">{cycle?.cycle_id}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {viewMode === 'form' ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Takeaway</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit Form</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md bg-[rgb(var(--clr-primary))] hover:opacity-90 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print Discharge Summary for Patient Takeaway"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Discharge</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Embryo Transfer discharge protocol and luteal phase support saved successfully!</span>
            </div>
          )}

          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* SECTION 1: Transfer & Catheter Procedure Log */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Sparkles className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                  <h3 className="font-bold text-sm text-slate-900">1. Transfer &amp; Catheter Technical Record</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Protocol Type *</label>
                    <select
                      value={transferType}
                      onChange={(e) => setTransferType(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    >
                      <option value="FET">Frozen Embryo Transfer (FET)</option>
                      <option value="Fresh ET">Fresh Embryo Transfer (Fresh ET)</option>
                      <option value="Donor ET">Donor Embryo Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Date *</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => {
                        setTransferDate(e.target.value);
                        setBetaHcgDueDate(
                          new Date(new Date(e.target.value).getTime() + 14 * 86400000)
                            .toISOString()
                            .split('T')[0]
                        );
                      }}
                      className="vmd-input text-xs w-full font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catheter Type *</label>
                    <select
                      value={catheterType}
                      onChange={(e) => setCatheterType(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="Cook Sydney IVF Catheter">Cook Sydney IVF Catheter</option>
                      <option value="Wallace Classic Two-Stage">Wallace Classic Two-Stage</option>
                      <option value="Guardia Access Soft-Pass">Guardia Access Soft-Pass</option>
                      <option value="Edwards-Wallace Sure View">Edwards-Wallace Sure View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ultrasound Guidance</label>
                    <select
                      value={ultrasoundGuidance}
                      onChange={(e) => setUltrasoundGuidance(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="Transabdominal (Full Bladder)">Transabdominal (Full Bladder)</option>
                      <option value="Transvaginal Ultrasound">Transvaginal Ultrasound</option>
                      <option value="Blind / Clinical Touch">Clinical Touch (No USG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood on Catheter Tip</label>
                    <select
                      value={bloodOnCatheter}
                      onChange={(e) => setBloodOnCatheter(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="None (Clean Catheter)">None (Clean Catheter)</option>
                      <option value="Minimal / Trace">Minimal / Trace Blood</option>
                      <option value="Moderate Blood on Outer Sheath">Moderate Blood on Outer Sheath</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Attending Clinician</label>
                    <input
                      type="text"
                      value={attendingDoctorName}
                      onChange={(e) => setAttendingDoctorName(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                {/* Statutory Double-Witness Safety Gate */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Mandatory Double-Witnessing &amp; Retained Embryo Verification
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Catheter outer and inner sheath flushed in culture media under stereomicroscope to confirm zero retained embryos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-900 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={retainedEmbryoChecked}
                        onChange={(e) => setRetainedEmbryoChecked(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Cleared: 0 Retained</span>
                    </label>

                    <input
                      type="text"
                      value={witnessEmbryologistName}
                      onChange={(e) => setWitnessEmbryologistName(e.target.value)}
                      placeholder="Witnessing Embryologist Name"
                      className="vmd-input text-xs py-1.5 bg-white border-emerald-300 w-44"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Embryos Transferred Details */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Baby className="w-4 h-4 text-pink-600" />
                  <h3 className="font-bold text-sm text-slate-900">2. Embryos Transferred Specification</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Number of Embryos Transferred</label>
                    <select
                      value={embryosTransferredCount}
                      onChange={(e) => setEmbryosTransferredCount(Number(e.target.value))}
                      className="vmd-input text-xs w-full font-bold text-indigo-700"
                    >
                      <option value={1}>1 (Elective Single Embryo Transfer — eSET)</option>
                      <option value={2}>2 (Double Embryo Transfer)</option>
                      <option value={3}>3 (Triple Embryo Transfer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Developmental Stage</label>
                    <select
                      value={embryoStage}
                      onChange={(e) => setEmbryoStage(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    >
                      <option value="Day 5 Blastocyst">Day 5 Blastocyst</option>
                      <option value="Day 6 Blastocyst">Day 6 Blastocyst</option>
                      <option value="Day 3 Cleavage (8-Cell)">Day 3 Cleavage (8-Cell)</option>
                      <option value="Day 2 Cleavage (4-Cell)">Day 2 Cleavage (4-Cell)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Embryo Grades (Gardner)</label>
                    <input
                      type="text"
                      value={embryoGrades}
                      onChange={(e) => setEmbryoGrades(e.target.value)}
                      placeholder="e.g. 4AA, 4AB"
                      className="vmd-input text-xs w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Luteal Support Medication Timetable */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">3. Luteal Phase Support Medication Schedule</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMedications([
                        ...medications,
                        { drug: '', dose: '', route: 'Oral', frequency: 'OD', instructions: '' },
                      ])
                    }
                    className="text-xs text-[rgb(var(--clr-primary))] font-bold hover:underline"
                  >
                    + Add Medication
                  </button>
                </div>

                <div className="space-y-2.5">
                  {medications.map((m, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-md p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={m.drug}
                          placeholder="Drug Name (e.g. Susten 400mg)"
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].drug = e.target.value;
                            setMedications(updated);
                          }}
                          className="vmd-input text-xs w-full font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={m.dose}
                          placeholder="Dose"
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].dose = e.target.value;
                            setMedications(updated);
                          }}
                          className="vmd-input text-xs w-full"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={m.route}
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].route = e.target.value;
                            setMedications(updated);
                          }}
                          className="vmd-input text-xs w-full"
                        >
                          <option value="Vaginal">Vaginal</option>
                          <option value="Oral">Oral</option>
                          <option value="IM (Intramuscular)">IM</option>
                          <option value="SC (Subcutaneous)">SC</option>
                          <option value="Transdermal">Transdermal</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={m.frequency}
                          placeholder="Frequency"
                          onChange={(e) => {
                            const updated = [...medications];
                            updated[idx].frequency = e.target.value;
                            setMedications(updated);
                          }}
                          className="vmd-input text-xs w-full"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Follow-up & Discharge Notes */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Calendar className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                  <h3 className="font-bold text-sm text-slate-900">4. Follow-Up Plan &amp; Home Precautions</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Day 14 Serum Beta-hCG Blood Test Date *
                    </label>
                    <input
                      type="date"
                      value={betaHcgDueDate}
                      onChange={(e) => setBetaHcgDueDate(e.target.value)}
                      className="vmd-input text-xs w-full font-mono font-bold text-pink-700 bg-pink-50/50 border-pink-200"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Target pregnancy blood test 14 days post-ET
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operative &amp; Clinical Discharge Notes
                    </label>
                    <textarea
                      rows={2}
                      value={dischargeNotes}
                      onChange={(e) => setDischargeNotes(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: FET Endometrial Preparation & Remaining Embryos (Collapsible) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-3">
                <details className="group">
                  <summary className="text-xs font-bold text-slate-700 cursor-pointer flex items-center justify-between hover:text-slate-900">
                    <span className="uppercase tracking-wider">4. FET Endometrial Preparation &amp; Remaining Embryos Inventory</span>
                    <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="mt-4 space-y-4 pt-3 border-t border-slate-200/80">
                    {/* Endometrial prep parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Preparation</label>
                        <select defaultValue="HRT / Programmed (Estrogen + Progesterone)" className="vmd-input text-xs w-full">
                          <option value="HRT / Programmed">HRT / Programmed (E2 + P4)</option>
                          <option value="Natural FET">Natural FET</option>
                          <option value="Modified Natural (Trigger)">Modified Natural (hCG Trigger)</option>
                          <option value="Mild Stimulation (Letrozole)">Mild Stimulation (Letrozole)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Thickness (mm)</label>
                        <input type="number" step="0.1" defaultValue={9.8} className="vmd-input text-xs w-full font-bold text-emerald-800" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Pattern</label>
                        <select defaultValue="Trilaminar (Type A)" className="vmd-input text-xs w-full">
                          <option value="Trilaminar (Type A)">Trilaminar (Triple Line - Type A)</option>
                          <option value="Isoechoic (Type B)">Isoechoic (Type B)</option>
                          <option value="Hyperechoic (Type C)">Hyperechoic (Type C)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">P4 Exposure at Transfer</label>
                        <input type="text" defaultValue="120 Hours (5 Full Days)" className="vmd-input text-xs w-full" />
                      </div>
                    </div>

                    {/* Remaining Embryos Audit */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Remaining Embryos Cryostorage Balance
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-slate-50 rounded border">
                          <span className="text-[10px] text-slate-400 block font-bold">Total Before FET</span>
                          <strong className="text-base text-slate-800">5</strong>
                        </div>
                        <div className="p-2 bg-pink-50 rounded border border-pink-200">
                          <span className="text-[10px] text-pink-700 block font-bold">Transferred</span>
                          <strong className="text-base text-pink-700">{embryosTransferredCount}</strong>
                        </div>
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-[10px] text-blue-700 block font-bold">Remaining Stored</span>
                          <strong className="text-base text-blue-800">{5 - Number(embryosTransferredCount)}</strong>
                        </div>
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                          <span className="text-[10px] text-amber-700 block font-bold">Thawed Unused</span>
                          <strong className="text-base text-amber-800">0</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border">
                          <span className="text-[10px] text-slate-400 block font-bold">Non-Viable</span>
                          <strong className="text-base text-slate-500">0</strong>
                        </div>
                      </div>

                      {/* Remaining Inventory Table */}
                      <table className="w-full text-left text-xs border-collapse border border-slate-200">
                        <thead className="bg-slate-100 text-slate-600 font-bold">
                          <tr>
                            <th className="p-2 border border-slate-200">Straw / Cryo ID</th>
                            <th className="p-2 border border-slate-200">Stage / Grade</th>
                            <th className="p-2 border border-slate-200">Tank Coordinates</th>
                            <th className="p-2 border border-slate-200">Current Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2 border border-slate-200 font-mono font-bold">STR-882-01</td>
                            <td className="p-2 border border-slate-200">Day 5 Blastocyst (4AA)</td>
                            <td className="p-2 border border-slate-200">Tank 1 / Canister 3 / Yellow Goblet</td>
                            <td className="p-2 border border-slate-200 font-semibold text-emerald-700">Stored / Active</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-mono font-bold">STR-882-02</td>
                            <td className="p-2 border border-slate-200">Day 5 Blastocyst (4AB)</td>
                            <td className="p-2 border border-slate-200">Tank 1 / Canister 3 / Yellow Goblet</td>
                            <td className="p-2 border border-slate-200 font-semibold text-emerald-700">Stored / Active</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            /* PREVIEW MODE: Printable Patient Takeaway Letterhead */
            <div className="bg-white border border-slate-300 rounded-lg p-8 max-w-4xl mx-auto space-y-6 shadow-sm print:border-none print:p-0">
              {/* Clinic Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    VaidyaMD Centre for Reproductive Medicine
                  </h1>
                  <p className="text-xs text-slate-600">
                    Department of Embryology &amp; Assisted Conception · ART Act 2021 Accredited
                  </p>
                  <p className="text-[11px] text-slate-400">
                    24x7 Fertility Helpline: +91 98765 43210 · info@vaidyamd.com
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-slate-500">
                  <p className="font-bold text-slate-900">{cycle?.cycle_id}</p>
                  <p>Date: {transferDate}</p>
                </div>
              </div>

              <div className="text-center py-1 bg-slate-100 rounded-lg">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Embryo Transfer Discharge Summary &amp; Luteal Care Protocol
                </h2>
              </div>

              {/* Patient Demographics Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-md border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient (Wife)</span>
                  <strong>{patient?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">VID</span>
                  <strong className="font-mono">{patient?.vid}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Age / Blood Group</span>
                  <strong>{patient?.age} yrs / {patient?.blood_group || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Husband Name</span>
                  <strong>{partner?.name || '—'}</strong>
                </div>
              </div>

              {/* Procedure Details */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                  Procedure &amp; Embryo Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Transfer Type:</span>
                    <strong>{transferType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Embryos Transferred:</span>
                    <strong className="text-pink-700 font-bold">{embryosTransferredCount} ({embryoStage})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Embryo Quality Grades:</span>
                    <strong className="font-mono">{embryoGrades}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Catheter &amp; Clearance:</span>
                    <strong>0 Retained (Cleared)</strong>
                  </div>
                </div>
              </div>

              {/* Luteal Support Prescriptions Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                  Luteal Phase Support Prescription (Crucial for Implantation)
                </h3>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border">Medicine</th>
                      <th className="p-2 border">Dose</th>
                      <th className="p-2 border">Route</th>
                      <th className="p-2 border">Frequency</th>
                      <th className="p-2 border">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((m, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 border font-bold text-slate-900">{m.drug}</td>
                        <td className="p-2 border">{m.dose}</td>
                        <td className="p-2 border font-semibold">{m.route}</td>
                        <td className="p-2 border">{m.frequency}</td>
                        <td className="p-2 border text-slate-600 text-[11px]">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Critical Instruction Box */}
              <div className="bg-pink-50 border-2 border-pink-200 rounded-md p-4 space-y-2 text-xs text-pink-950">
                <div className="flex items-center gap-2 font-bold text-pink-900 uppercase">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span>Next Crucial Milestone: Pregnancy Blood Test</span>
                </div>
                <p>
                  Please report to the laboratory for your <strong>Serum Beta-hCG blood test</strong> on{' '}
                  <strong className="text-pink-700 underline font-mono text-sm">{betaHcgDueDate}</strong>.
                </p>
                <p className="text-[11px] text-pink-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1" /><strong>IMPORTANT:</strong> Do not discontinue any progesterone or estradiol medications without consulting your treating fertility specialist, even in the event of light spotting.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-700">
                <div>
                  <div className="border-t border-slate-400 pt-1 w-48 font-bold text-center">
                    {witnessEmbryologistName}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Senior Clinical Embryologist</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 w-48 font-bold text-center">
                    {attendingDoctorName}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Consultant Reproductive Medicine</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-md transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-md shadow-md shadow-pink-600/20 transition-all flex items-center gap-2"
          >
            {isSaving ? 'Saving Protocol...' : 'Save ET Discharge Summary'}
          </button>
        </div>
      </div>
    </div>
  );
}
