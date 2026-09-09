'use client';

import React, { useState, useEffect } from 'react';
import { treatmentCyclesApi, protocolsApi, authApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface TreatmentCycleWizardProps {
  patientId: string;
  partnerId?: string;
  onSuccess: (cycle: any) => void;
  onCancel: () => void;
  userId: string;
}

const steps = [
  { id: 1, label: 'Intended Treatment', icon: '🎯' },
  { id: 2, label: 'Gamete Source', icon: '🧬' },
  { id: 3, label: 'PGS / PGD', icon: '🔬' },
  { id: 4, label: 'Protocol & Sentinel Dates', icon: '📅' },
  { id: 5, label: 'Endometrial Monitoring', icon: '📊' },
  { id: 6, label: 'Medication Calendar', icon: '💊' },
  { id: 7, label: 'Summary & Submit', icon: '✅' },
];

interface EndometrialMonitoringRow {
  date: string;
  day_of_cycle: number;
  thickness_mm: number;
  pattern: string;
  vascularity: string;
}

interface CycleFormState {
  treatment_type: string;
  attempt_number: number;
  treating_doctor_id: string;
  female_factors: string[];
  male_factors: string[];
  treatment_at_other_centre: boolean;
  previous_centre_name: string;
  protocol_template_id: string;
  sentinel_dates: {
    lmp_day1: string;
    baseline_scan: string;
    stim_start: string;
    trigger: string;
    opu: string;
    et: string;
  };
  gametes_source: {
    oocyte: string;
    donor_oocyte_id: string;
    sperm: string;
    donor_sperm_id: string;
  };
  pgs_pgd_data: {
    indicated: boolean;
    type: string;
    lab_name: string;
    biopsy_day: string;
  };
  endometrial_monitoring: EndometrialMonitoringRow[];
  remarks: string;
}

export default function TreatmentCycleWizard({
  patientId,
  partnerId,
  onSuccess,
  onCancel,
  userId,
}: TreatmentCycleWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarPreview, setCalendarPreview] = useState<any>(null);

  const [form, setForm] = useState<CycleFormState>({
    treatment_type: 'ICSI',
    attempt_number: 1,
    treating_doctor_id: '',
    female_factors: [],
    male_factors: [],
    treatment_at_other_centre: false,
    previous_centre_name: '',
    protocol_template_id: '',
    sentinel_dates: {
      lmp_day1: '',
      baseline_scan: '',
      stim_start: '',
      trigger: '',
      opu: '',
      et: '',
    },
    gametes_source: {
      oocyte: 'self',
      donor_oocyte_id: '',
      sperm: 'partner',
      donor_sperm_id: '',
    },
    pgs_pgd_data: {
      indicated: false,
      type: 'PGT-A',
      lab_name: '',
      biopsy_day: 'D5',
    },
    endometrial_monitoring: [],
    remarks: '',
  });

  useEffect(() => {
    protocolsApi.list().then((p: any) => {
      setProtocols(p || []);
      if (p && p.length > 0) {
        setForm((prev) => ({ ...prev, protocol_template_id: p[0].id }));
      }
    }).catch(() => {});

    authApi.listUsers().then((u: any) => {
      if (Array.isArray(u)) {
        const docs = u.filter((x: any) => x.is_doctor || x.role === 'doctor');
        setDoctors(docs);
        if (docs.length > 0) {
          setForm((prev) => ({ ...prev, treating_doctor_id: docs[0].id }));
        }
      }
    }).catch(() => {});
  }, []);

  const generateFallbackCalendar = () => {
    const baseDateStr = form.sentinel_dates.stim_start || form.sentinel_dates.lmp_day1 || new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayNum = i + 1;
      let milestone = '';
      if (iso === form.sentinel_dates.lmp_day1) milestone = 'Day 1 (LMP)';
      else if (iso === form.sentinel_dates.baseline_scan) milestone = 'Baseline Scan';
      else if (iso === form.sentinel_dates.stim_start) milestone = 'Stimulation Start';
      else if (iso === form.sentinel_dates.trigger) milestone = 'Trigger Injection';
      else if (iso === form.sentinel_dates.opu) milestone = 'OPU (Egg Retrieval)';
      else if (iso === form.sentinel_dates.et) milestone = 'Embryo Transfer';

      days.push({
        date: iso,
        day_number: dayNum,
        display_date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        day_of_week: dayNames[d.getDay()],
        stim_day_label: dayNum >= 2 && dayNum <= 12 ? `Stim Day ${dayNum - 1}` : null,
        milestone: milestone || null,
        medications: [],
      });
    }
    return {
      start_date: baseDateStr,
      days,
    };
  };

  // Recalculate preview calendar whenever protocol or sentinel dates change
  useEffect(() => {
    if (form.protocol_template_id) {
      protocolsApi.previewCalendar({
        protocol_template_id: form.protocol_template_id,
        sentinel_dates: form.sentinel_dates,
      }).then((cal: any) => {
        if (cal && cal.days && cal.days.length > 0) {
          setCalendarPreview(cal);
        } else {
          setCalendarPreview(generateFallbackCalendar());
        }
      }).catch(() => {
        setCalendarPreview(generateFallbackCalendar());
      });
    } else {
      setCalendarPreview(generateFallbackCalendar());
    }
  }, [form.protocol_template_id, form.sentinel_dates]);

  const updateSentinel = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      sentinel_dates: { ...prev.sentinel_dates, [field]: value },
    }));
  };

  const handleLmpChange = (lmpDate: string) => {
    if (!lmpDate) {
      updateSentinel('lmp_day1', '');
      return;
    }
    const lmp = new Date(lmpDate);
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().split('T')[0];
    };

    setForm((prev) => ({
      ...prev,
      sentinel_dates: {
        ...prev.sentinel_dates,
        lmp_day1: lmpDate,
        baseline_scan: addDays(lmp, 1), // Day 2
        stim_start: addDays(lmp, 2),    // Day 3
        trigger: addDays(lmp, 11),      // Day 12
        opu: addDays(lmp, 13),          // Day 14
        et: addDays(lmp, 18),           // Day 19
      },
    }));
  };

  const handleAddEndometrialRow = () => {
    const nextDay = (form.endometrial_monitoring.length + 1) * 2 + 5;
    setForm((prev) => ({
      ...prev,
      endometrial_monitoring: [
        ...prev.endometrial_monitoring,
        {
          date: new Date().toISOString().split('T')[0],
          day_of_cycle: nextDay,
          thickness_mm: 8.0,
          pattern: 'Trilaminar',
          vascularity: 'Zone 3',
        },
      ],
    }));
  };

  const handleUpdateEndometrialRow = (idx: number, field: keyof EndometrialMonitoringRow, value: any) => {
    setForm((prev) => {
      const updated = [...prev.endometrial_monitoring];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, endometrial_monitoring: updated };
    });
  };

  const handleRemoveEndometrialRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      endometrial_monitoring: prev.endometrial_monitoring.filter((_, i) => i !== idx),
    }));
  };

  const handleAddDayMedication = (dayNumber: number) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber) {
        const meds = d.medications ? [...d.medications] : [];
        meds.push({
          drug_name: 'Inj. Cetrotide',
          dose: '0.25 mg',
          frequency: 'OD',
        });
        return { ...d, medications: meds };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const handleUpdateDayMedication = (dayNumber: number, medIdx: number, field: string, value: string) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber && d.medications) {
        const meds = [...d.medications];
        meds[medIdx] = { ...meds[medIdx], [field]: value };
        return { ...d, medications: meds };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const handleRemoveDayMedication = (dayNumber: number, medIdx: number) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber && d.medications) {
        return { ...d, medications: d.medications.filter((_: any, i: number) => i !== medIdx) };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const handlePrintCalendar = () => {
    window.print();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const cycleRemarks = form.previous_centre_name
        ? `${form.remarks} [Initiated at previous centre: ${form.previous_centre_name}]`
        : form.remarks;

      const finalSentinelDates = {
        ...form.sentinel_dates,
        custom_calendar: calendarPreview?.days || [],
      };

      const cycle = await treatmentCyclesApi.create({
        patient_id: patientId,
        partner_id: partnerId || undefined,
        treating_doctor_id: form.treating_doctor_id || userId,
        treatment_type: form.treatment_type,
        attempt_number: form.attempt_number,
        female_factors: form.female_factors,
        male_factors: form.male_factors,
        treatment_at_other_centre: form.treatment_at_other_centre,
        protocol_template_id: form.protocol_template_id || undefined,
        sentinel_dates: finalSentinelDates,
        gametes_source: form.gametes_source,
        pgs_pgd_data: form.pgs_pgd_data,
        endometrial_monitoring: form.endometrial_monitoring,
        remarks: cycleRemarks,
        created_by: userId,
      });
      onSuccess(cycle);
    } catch (err: any) {
      alert(err.message || 'Failed to start treatment cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-6xl w-full max-h-[92vh] flex flex-col">
      {/* Header & Steps Bar */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black">Add New Treatment Cycle</h2>
            <p className="text-xs text-slate-400">Step {currentStep} of {steps.length}: {steps[currentStep - 1].label}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {steps.map((s) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                currentStep === s.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : currentStep > s.id
                  ? 'bg-slate-800 text-emerald-400'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {/* Step 1: Intended Treatment */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">🎯 Intended Treatment & Clinical Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Treatment Type</label>
                <select
                  value={form.treatment_type}
                  onChange={(e) => setForm({ ...form, treatment_type: e.target.value })}
                  className="vmd-input"
                >
                  <option value="ICSI">ICSI (Intracytoplasmic Sperm Injection)</option>
                  <option value="IVF">Conventional IVF</option>
                  <option value="ICSI_FET">ICSI + Freeze-All + FET</option>
                  <option value="FET">Frozen Embryo Transfer (FET)</option>
                  <option value="IUI_H">IUI — Husband (IUI-H)</option>
                  <option value="IUI_D">IUI — Donor (IUI-D)</option>
                  <option value="EGG_FREEZING">Social / Medical Oocyte Freezing</option>
                  <option value="SURROGACY">Surrogacy ART Cycle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Attempt Number</label>
                <input
                  type="number"
                  value={form.attempt_number}
                  onChange={(e) => setForm({ ...form, attempt_number: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="vmd-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Treating Consultant</label>
                <select
                  value={form.treating_doctor_id}
                  onChange={(e) => setForm({ ...form, treating_doctor_id: e.target.value })}
                  className="vmd-input"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="treatment_at_other_centre"
                    checked={form.treatment_at_other_centre}
                    onChange={(e) => setForm({ ...form, treatment_at_other_centre: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="treatment_at_other_centre" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Treatment initiated at another centre / Referral cycle
                  </label>
                </div>
                {form.treatment_at_other_centre && (
                  <div className="mt-2.5 pl-6 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Previous Fertility Centre / Clinic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Oasis Fertility, Cloudnine, Apollo Cradle..."
                      value={form.previous_centre_name || ''}
                      onChange={(e) => setForm({ ...form, previous_centre_name: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Gametes */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">🧬 Gametes Source (ART Act 2021 Alignment)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pink-50/50 border border-pink-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-pink-800">Oocyte Source</h4>
                <div className="flex gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="oocyte_source"
                      value="self"
                      checked={form.gametes_source.oocyte === 'self'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, oocyte: 'self' } })}
                    />
                    <span>Self (Autologous)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="oocyte_source"
                      value="donor"
                      checked={form.gametes_source.oocyte === 'donor'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, oocyte: 'donor' } })}
                    />
                    <span>Donor Oocyte</span>
                  </label>
                </div>
                {form.gametes_source.oocyte === 'donor' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor ID (ART Bank Form 23)</label>
                    <input
                      type="text"
                      placeholder="e.g. DONOR-OOCYTE-8812"
                      value={form.gametes_source.donor_oocyte_id}
                      onChange={(e) => setForm({ ...form, gametes_source: { ...form.gametes_source, donor_oocyte_id: e.target.value } })}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs text-blue-800">Sperm Source</h4>
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="partner"
                      checked={form.gametes_source.sperm === 'partner'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'partner' } })}
                    />
                    <span>Partner (Ejaculate)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="surgical"
                      checked={form.gametes_source.sperm === 'surgical'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'surgical' } })}
                    />
                    <span>Surgical (TESA/PESA)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="donor"
                      checked={form.gametes_source.sperm === 'donor'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'donor' } })}
                    />
                    <span>Donor Sperm</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: PGS/PGD */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">🔬 Preimplantation Genetic Testing (PGT)</h3>
            
            {!['ICSI', 'IVF', 'ICSI_FET', 'SURROGACY'].includes(form.treatment_type) ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
                PGT is not applicable for the selected treatment type ({form.treatment_type}).
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pgs_pgd_data.indicated}
                  onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, indicated: e.target.checked } })}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <div>
                  <p className="font-bold text-xs text-slate-900">Preimplantation Genetic Testing Indicated</p>
                  <p className="text-[11px] text-slate-500">Enable trophectoderm biopsy tracking for aneuploidy / single-gene defect screening</p>
                </div>
              </label>

              {form.pgs_pgd_data.indicated && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">PGT Assay Type</label>
                    <select
                      value={form.pgs_pgd_data.type}
                      onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, type: e.target.value } })}
                      className="vmd-input"
                    >
                      <option value="PGT-A">PGT-A (Aneuploidy Screening - NGS)</option>
                      <option value="PGT-M">PGT-M (Monogenic / Single Gene)</option>
                      <option value="PGT-SR">PGT-SR (Structural Rearrangements)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Genetics Reference Lab</label>
                    <input
                      type="text"
                      value={form.pgs_pgd_data.lab_name}
                      onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, lab_name: e.target.value } })}
                      className="vmd-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Biopsy Stage</label>
                    <select
                      value={form.pgs_pgd_data.biopsy_day}
                      onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, biopsy_day: e.target.value } })}
                      className="vmd-input"
                    >
                      <option value="D5">Day 5 (Expanded Trophectoderm)</option>
                      <option value="D6">Day 6 Blastocyst</option>
                      <option value="D3">Day 3 (Cleavage Blastomere)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}

        {/* Step 4: Protocol & Sentinel Dates */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-black text-slate-900">📅 Stimulation Protocol & Sentinel Dates</h3>
              <p className="text-[11px] text-slate-500">Set Day 1 (LMP) to auto-calculate milestones, or customize dates individually.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Stimulation Protocol</label>
              <select
                value={form.protocol_template_id}
                onChange={(e) => setForm({ ...form, protocol_template_id: e.target.value })}
                className="vmd-input font-bold text-indigo-900 bg-indigo-50/40"
              >
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
              <span>💡</span>
              <span>
                <strong>Auto-Calculation:</strong> Entering Day 1 (LMP) auto-populates Day 2 Baseline Scan, Day 3 Stim Start, Day 12 Trigger, Day 14 OPU, and Day 19 ET. You can adjust any date manually.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {[
                { key: 'lmp_day1', label: 'Day 1 (LMP Date)', icon: '🩸', show: true },
                { key: 'baseline_scan', label: 'Baseline Scan Date', icon: '🔍', show: true },
                { key: 'stim_start', label: 'Stimulation Start Date', icon: '💉', show: ['ICSI', 'IVF', 'ICSI_FET', 'EGG_FREEZING', 'SURROGACY'].includes(form.treatment_type) },
                { key: 'trigger', label: 'Estimated Trigger Date', icon: '⚡', show: ['ICSI', 'IVF', 'ICSI_FET', 'EGG_FREEZING', 'SURROGACY', 'IUI_H', 'IUI_D'].includes(form.treatment_type) },
                { key: 'opu', label: 'Planned OPU Retrieval', icon: '🧫', show: ['ICSI', 'IVF', 'ICSI_FET', 'EGG_FREEZING', 'SURROGACY'].includes(form.treatment_type) },
                { key: 'et', label: 'Planned Embryo Transfer', icon: '👶', show: ['ICSI', 'IVF', 'FET', 'SURROGACY'].includes(form.treatment_type) },
              ].filter(s => s.show).map((s) => (
                <div key={s.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {s.icon} {s.label}
                  </label>
                  <input
                    type="date"
                    value={(form.sentinel_dates as any)[s.key] || ''}
                    onChange={(e) => {
                      if (s.key === 'lmp_day1') {
                        handleLmpChange(e.target.value);
                      } else {
                        updateSentinel(s.key, e.target.value);
                      }
                    }}
                    className="vmd-input text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Endometrial Monitoring */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">📊 Serial Endometrial & Follicular Monitoring</h3>
                <p className="text-[11px] text-slate-500">Track endometrial thickness, echo-pattern, and sub-endometrial vascularity zones</p>
              </div>
              <button
                type="button"
                onClick={handleAddEndometrialRow}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
              >
                + Add Scan Date
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Scan Date</th>
                    <th className="p-3">Cycle Day</th>
                    <th className="p-3">Thickness (mm)</th>
                    <th className="p-3">Pattern</th>
                    <th className="p-3">Vascularity Zone</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.endometrial_monitoring.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5">
                        <input
                          type="date"
                          value={m.date}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'date', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={m.day_of_cycle}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'day_of_cycle', parseInt(e.target.value) || 0)}
                          className="vmd-input text-xs py-1 px-2 w-20"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          value={m.thickness_mm}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'thickness_mm', parseFloat(e.target.value) || 0)}
                          className="vmd-input text-xs py-1 px-2 w-24 font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={m.pattern}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'pattern', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        >
                          <option value="Trilaminar">Trilaminar (Triple-line)</option>
                          <option value="Homogeneous">Homogeneous</option>
                          <option value="Hyperechoic">Hyperechoic</option>
                          <option value="Secretory">Secretory / Luteal</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={m.vascularity}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'vascularity', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        >
                          <option value="Zone 1">Zone 1 (Peri-endometrial)</option>
                          <option value="Zone 2">Zone 2 (Outer sub-endometrial)</option>
                          <option value="Zone 3">Zone 3 (Inner sub-endometrial)</option>
                          <option value="Zone 4">Zone 4 (Intra-endometrial)</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveEndometrialRow(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-xs"
                          title="Delete Scan Record"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {form.endometrial_monitoring.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        No scan records added yet. Click "+ Add Scan Date" to record monitoring data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 6: Medication Calendar */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">💊 Patient Day-by-Day Medication Calendar</h3>
                <p className="text-[11px] text-slate-500">Auto-generated schedule calculated by Stimulation Rules Engine</p>
              </div>
              <button
                type="button"
                onClick={handlePrintCalendar}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
              >
                🖨️ Print for Patient
              </button>
            </div>

            {calendarPreview && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {calendarPreview.days?.map((d: any) => (
                  <div
                    key={d.day_number}
                    className={`p-3 rounded-2xl border transition-all ${
                      d.milestone
                        ? 'border-indigo-400 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-300'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                      <span className="font-bold text-xs text-slate-800">{d.display_date}</span>
                      <span className="text-[10px] font-bold text-slate-400">{d.day_of_week.slice(0, 3)}</span>
                    </div>

                    {d.stim_day_label && (
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded mr-1">
                        {d.stim_day_label}
                      </span>
                    )}

                    {d.milestone && (
                      <p className="text-[11px] font-bold text-indigo-800 mt-1">
                        {d.milestone}
                      </p>
                    )}

                    <div className="mt-2 space-y-1.5">
                      {d.medications?.length > 0 ? (
                        d.medications.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] group relative">
                            <div className="flex items-start justify-between">
                              <input
                                type="text"
                                value={m.drug_name}
                                onChange={(e) => handleUpdateDayMedication(d.day_number, mIdx, 'drug_name', e.target.value)}
                                className="font-bold text-slate-800 text-[11px] bg-transparent border-none p-0 focus:outline-none w-full"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveDayMedication(d.day_number, mIdx)}
                                className="text-slate-400 hover:text-rose-500 font-bold ml-1 text-[10px]"
                                title="Remove medication"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex gap-1 text-[10px] text-slate-500 mt-1">
                              <input
                                type="text"
                                value={m.dose}
                                onChange={(e) => handleUpdateDayMedication(d.day_number, mIdx, 'dose', e.target.value)}
                                className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] w-20"
                                placeholder="Dose"
                              />
                              <input
                                type="text"
                                value={m.frequency}
                                onChange={(e) => handleUpdateDayMedication(d.day_number, mIdx, 'frequency', e.target.value)}
                                className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] w-14"
                                placeholder="Freq"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No scheduled meds</p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAddDayMedication(d.day_number)}
                        className="w-full py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 rounded-lg border border-dashed border-indigo-200 transition-colors"
                      >
                        + Add Medication
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 7: Summary */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b pb-2">✅ Review & Launch Treatment Cycle</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <p><span className="text-slate-500 font-medium">Treatment:</span> <strong className="text-slate-800">{form.treatment_type} (Attempt #{form.attempt_number})</strong></p>
                <p><span className="text-slate-500 font-medium">Oocyte / Sperm:</span> <strong className="text-slate-800">{form.gametes_source.oocyte} / {form.gametes_source.sperm}</strong></p>
                <p><span className="text-slate-500 font-medium">LMP Day 1:</span> <strong className="text-slate-800">{form.sentinel_dates.lmp_day1}</strong></p>
                <p><span className="text-slate-500 font-medium">Stim Start:</span> <strong className="text-slate-800">{form.sentinel_dates.stim_start}</strong></p>
                <p><span className="text-slate-500 font-medium">Est. OPU:</span> <strong className="text-slate-800">{form.sentinel_dates.opu}</strong></p>
                <p><span className="text-slate-500 font-medium">Est. ET:</span> <strong className="text-slate-800">{form.sentinel_dates.et}</strong></p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Clinical Remarks & Instructions</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                className="vmd-input text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 disabled:opacity-40 text-xs transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-3">
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-xs transition-colors shadow-md shadow-indigo-500/20"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-xs transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              {isSubmitting ? 'Starting Cycle...' : '🚀 Launch Treatment Cycle'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
