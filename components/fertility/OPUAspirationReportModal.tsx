'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Microscope,
  Eye,
  Calendar,
  Clock,
  Activity,
  HeartPulse,
  UserCheck,
  Baby,
} from 'lucide-react';
import { andrologyApi } from '@/lib/api';

export interface OPUAspirationReportModalProps {
  patient: any;
  cycle?: any;
  activeCycle?: any;
  partner?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function OPUAspirationReportModal({
  patient,
  cycle,
  activeCycle,
  partner,
  onClose,
  onSaved,
}: OPUAspirationReportModalProps) {
  const resolvedCycle = activeCycle || cycle;
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // SUMMARY
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reasonForART, setReasonForART] = useState(resolvedCycle?.indication || '');
  const [femaleFactor, setFemaleFactor] = useState(resolvedCycle?.female_factors?.join(', ') || '');
  const [maleFactor, setMaleFactor] = useState(resolvedCycle?.male_factors?.join(', ') || '');
  const [addOnDrugs, setAddOnDrugs] = useState('');

  // PRE-TREATMENTS
  const [preTreatments, setPreTreatments] = useState('');
  const [preTreatmentComments, setPreTreatmentComments] = useState('');
  const [daysPreTreatment, setDaysPreTreatment] = useState('');
  const [lmp, setLmp] = useState(resolvedCycle?.sentinel_dates?.lmp_day1 || resolvedCycle?.lmp_date || '');

  // STIMULATION
  const [stimulationProtocol, setStimulationProtocol] = useState(resolvedCycle?.protocol_name || resolvedCycle?.protocol_plan || resolvedCycle?.treatment_type || '');
  const [daysStimulation, setDaysStimulation] = useState('');
  const [stimulationDate, setStimulationDate] = useState(resolvedCycle?.sentinel_dates?.stim_start || resolvedCycle?.start_date || '');
  const [oralStimulatingAgents, setOralStimulatingAgents] = useState('');
  const [downRegulation, setDownRegulation] = useState('');
  const [downRegulationDays, setDownRegulationDays] = useState('');
  const [downRegulationDate, setDownRegulationDate] = useState('');
  const [downRegulationE2, setDownRegulationE2] = useState('');
  const [day2EndometrialThickness, setDay2EndometrialThickness] = useState('');

  // HORMONES
  const [rfshDosage, setRfshDosage] = useState('');
  const [rlhDosage, setRlhDosage] = useState('');
  const [hphmgDosage, setHphmgDosage] = useState('');
  const [hpfshDosage, setHpfshDosage] = useState('');
  const [totalGonadotrophinDose, setTotalGonadotrophinDose] = useState('');
  const [deviationDuringCycle, setDeviationDuringCycle] = useState('');
  const [endometrialThickness, setEndometrialThickness] = useState('');
  const [fluidInCavity, setFluidInCavity] = useState('');
  const [interventionsDuringCycle, setInterventionsDuringCycle] = useState('');
  const [growthHormoneDosage, setGrowthHormoneDosage] = useState('');

  // TRIGGER
  const [trigger, setTrigger] = useState('');
  const [triggerComments, setTriggerComments] = useState('');
  const [triggerDateTime, setTriggerDateTime] = useState(
    resolvedCycle?.sentinel_dates?.trigger ? `${resolvedCycle.sentinel_dates.trigger}T21:30` : ''
  );
  const [repeat12hTrigger, setRepeat12hTrigger] = useState('');
  const [preTriggerE2, setPreTriggerE2] = useState('');
  const [preTriggerLH, setPreTriggerLH] = useState('');
  const [preTriggerProgesterone, setPreTriggerProgesterone] = useState('');
  const [postTriggerLH, setPostTriggerLH] = useState('');
  const [postTriggerProgesterone, setPostTriggerProgesterone] = useState('');
  const [postTriggerBHCG, setPostTriggerBHCG] = useState('');
  const [triggerDayE2, setTriggerDayE2] = useState('');
  const [triggerDayEndometrialThickness, setTriggerDayEndometrialThickness] = useState('');

  // OPU PROCEDURAL
  const [opuDateTime, setOpuDateTime] = useState(
    resolvedCycle?.sentinel_dates?.opu ? `${resolvedCycle.sentinel_dates.opu}T09:00` : ''
  );
  const [surgeon, setSurgeon] = useState(resolvedCycle?.doctor_name || resolvedCycle?.treating_doctor_name || '');
  const [anaesthetist, setAnaesthetist] = useState('');
  const [otherSurgeons, setOtherSurgeons] = useState('');
  const [opuTotalDose, setOpuTotalDose] = useState('');
  const [selfDonor, setSelfDonor] = useState(resolvedCycle?.gametes_source?.oocyte === 'donor' ? 'Donor' : 'Self');
  const [triggerOpuDifference, setTriggerOpuDifference] = useState('');
  const [folliclesOver14, setFolliclesOver14] = useState('');
  const [oocytesRetrieved, setOocytesRetrieved] = useState('');
  const [matureOocytes, setMatureOocytes] = useState('');
  const [immatureOocytes, setImmatureOocytes] = useState('');
  const [oocyteQuality, setOocyteQuality] = useState('');
  const [oocyteAbnormalities, setOocyteAbnormalities] = useState('');
  const [freezing, setFreezing] = useState('');
  const [spermDetails, setSpermDetails] = useState('');
  const [advancedSpermTechnique, setAdvancedSpermTechnique] = useState('');
  const [adviceOnDischarge, setAdviceOnDischarge] = useState('');

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'opu_aspiration_report',
        data: {
          report_date: reportDate,
          cycle_id: activeCycle?.id || null,
          cycle_code: activeCycle?.cycle_id || 'ART-01',
          summary: {
            reason_for_art: reasonForART,
            female_factor: femaleFactor,
            male_factor: maleFactor,
            add_on_drugs: addOnDrugs,
          },
          pre_treatments: {
            protocol: preTreatments,
            comments: preTreatmentComments,
            days: parseInt(daysPreTreatment, 10) || 0,
            lmp,
          },
          stimulation: {
            protocol: stimulationProtocol,
            days: parseInt(daysStimulation, 10) || 0,
            date: stimulationDate,
            oral_agents: oralStimulatingAgents,
            down_regulation: downRegulation,
            down_regulation_days: parseInt(downRegulationDays, 10) || 0,
            down_regulation_date: downRegulationDate,
            down_regulation_e2: downRegulationE2,
            day2_et_mm: day2EndometrialThickness,
          },
          hormones: {
            rfsh_dose: rfshDosage,
            rlh_dose: rlhDosage,
            hphmg_dose: hphmgDosage,
            hpfsh_dose: hpfshDosage,
            total_gonadotrophin_dose: totalGonadotrophinDose,
            deviation: deviationDuringCycle,
            et_mm: endometrialThickness,
            fluid_in_cavity: fluidInCavity,
            interventions: interventionsDuringCycle,
            growth_hormone: growthHormoneDosage,
          },
          trigger: {
            agent: trigger,
            comments: triggerComments,
            date_time: triggerDateTime,
            repeat_12h: repeat12hTrigger,
            pre_trigger_e2: preTriggerE2,
            pre_trigger_lh: preTriggerLH,
            pre_trigger_p4: preTriggerProgesterone,
            post_trigger_lh: postTriggerLH,
            post_trigger_p4: postTriggerProgesterone,
            post_trigger_bhcg: postTriggerBHCG,
            trigger_day_e2: triggerDayE2,
            trigger_day_et: triggerDayEndometrialThickness,
          },
          opu: {
            date_time: opuDateTime,
            surgeon,
            anaesthetist,
            other_surgeons: otherSurgeons,
            anesthesia_dose: opuTotalDose,
            self_donor: selfDonor,
            trigger_opu_diff_hrs: triggerOpuDifference,
            follicles_over_14: parseInt(folliclesOver14, 10) || 0,
            oocytes_retrieved: parseInt(oocytesRetrieved, 10) || 0,
            mature_oocytes_mii: parseInt(matureOocytes, 10) || 0,
            immature_oocytes: parseInt(immatureOocytes, 10) || 0,
            oocyte_quality: oocyteQuality,
            abnormalities: oocyteAbnormalities,
            freezing_plan: freezing,
            sperm_details: spermDetails,
            advanced_technique: advancedSpermTechnique,
            advice_on_discharge: adviceOnDischarge,
          },
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
      alert(err.message || 'Failed to save OPU aspiration report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Oocyte Pick-Up (OPU) &amp; Aspiration Report
              </h2>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patient?.name || 'Female Patient'}</span> ({patient?.vid || 'VID-000'})
                {activeCycle && ` · Cycle ID: ${activeCycle.cycle_id}`}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* Section 1: Summary & Pre-Treatments */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. Summary &amp; Infertility Etiology
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-bold">Report Date:</span>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="vmd-input text-xs py-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason for ART</label>
                    <input
                      type="text"
                      value={reasonForART}
                      onChange={(e) => setReasonForART(e.target.value)}
                      className="vmd-input text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Female Factor</label>
                    <input
                      type="text"
                      value={femaleFactor}
                      onChange={(e) => setFemaleFactor(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Male Factor</label>
                    <input
                      type="text"
                      value={maleFactor}
                      onChange={(e) => setMaleFactor(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Add-On Drugs &amp; Adjuvants</label>
                    <input
                      type="text"
                      value={addOnDrugs}
                      onChange={(e) => setAddOnDrugs(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Stimulation & Gonadotropins */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Stimulation Protocol &amp; Gonadotropins
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Stimulation Protocol</label>
                    <input
                      type="text"
                      value={stimulationProtocol}
                      onChange={(e) => setStimulationProtocol(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Days of Stimulation</label>
                    <input
                      type="number"
                      value={daysStimulation}
                      onChange={(e) => setDaysStimulation(e.target.value)}
                      className="vmd-input text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Stimulation Start Date</label>
                    <input
                      type="date"
                      value={stimulationDate}
                      onChange={(e) => setStimulationDate(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Patient LMP Date</label>
                    <input
                      type="date"
                      value={lmp}
                      onChange={(e) => setLmp(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">rFSH Dosage</label>
                    <input
                      type="text"
                      value={rfshDosage}
                      onChange={(e) => setRfshDosage(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">HP-hMG / rLH Dosage</label>
                    <input
                      type="text"
                      value={hphmgDosage}
                      onChange={(e) => setHphmgDosage(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Gonadotrophin</label>
                    <input
                      type="text"
                      value={totalGonadotrophinDose}
                      onChange={(e) => setTotalGonadotrophinDose(e.target.value)}
                      className="vmd-input text-xs font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Thickness (ET)</label>
                    <input
                      type="text"
                      value={endometrialThickness}
                      onChange={(e) => setEndometrialThickness(e.target.value)}
                      className="vmd-input text-xs font-bold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Trigger Kinetics */}
              <div className="border border-slate-200 rounded-lg p-4 bg-amber-50/40 space-y-3">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  3. Trigger Administration &amp; Hormonal Response
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Trigger Medication</label>
                    <input
                      type="text"
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value)}
                      className="vmd-input text-xs font-semibold text-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Trigger Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={triggerDateTime}
                      onChange={(e) => setTriggerDateTime(e.target.value)}
                      className="vmd-input text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Follicles &gt; 14 mm</label>
                    <input
                      type="number"
                      value={folliclesOver14}
                      onChange={(e) => setFolliclesOver14(e.target.value)}
                      className="vmd-input text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200/50">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pre-Trigger E2 (pg/mL)</label>
                    <input
                      type="text"
                      value={preTriggerE2}
                      onChange={(e) => setPreTriggerE2(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pre-Trigger P4 (ng/mL)</label>
                    <input
                      type="text"
                      value={preTriggerProgesterone}
                      onChange={(e) => setPreTriggerProgesterone(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-Trigger LH (mIU/mL)</label>
                    <input
                      type="text"
                      value={postTriggerLH}
                      onChange={(e) => setPostTriggerLH(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-Trigger P4 (ng/mL)</label>
                    <input
                      type="text"
                      value={postTriggerProgesterone}
                      onChange={(e) => setPostTriggerProgesterone(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: OPU Procedure & Gamete Yield */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-pink-700 text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                  <span>4. Oocyte Pick-Up (OPU) Operative &amp; Gamete Yield</span>
                  <span className="text-[10px] font-normal text-white/80">Aspiration Yield</span>
                </div>
                <div className="p-4 bg-white space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">OPU Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        value={opuDateTime}
                        onChange={(e) => setOpuDateTime(e.target.value)}
                        className="vmd-input text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Operating Surgeon</label>
                      <input
                        type="text"
                        value={surgeon}
                        onChange={(e) => setSurgeon(e.target.value)}
                        className="vmd-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Anaesthetist</label>
                      <input
                        type="text"
                        value={anaesthetist}
                        onChange={(e) => setAnaesthetist(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Trigger-OPU Gap</label>
                      <input
                        type="text"
                        value={triggerOpuDifference}
                        onChange={(e) => setTriggerOpuDifference(e.target.value)}
                        className="vmd-input text-xs font-bold text-blue-700"
                      />
                    </div>
                  </div>

                  {/* Gamete Yield Counters */}
                  <div className="bg-pink-50/60 p-3.5 rounded-lg border border-pink-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-2 bg-white rounded border border-pink-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Oocytes (COCs)</span>
                      <input
                        type="number"
                        value={oocytesRetrieved}
                        onChange={(e) => setOocytesRetrieved(e.target.value)}
                        className="text-2xl font-black text-pink-700 text-center w-full bg-transparent border-0 focus:ring-0 p-0"
                      />
                    </div>
                    <div className="p-2 bg-white rounded border border-pink-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Mature Oocytes (MII)</span>
                      <input
                        type="number"
                        value={matureOocytes}
                        onChange={(e) => setMatureOocytes(e.target.value)}
                        className="text-2xl font-black text-emerald-700 text-center w-full bg-transparent border-0 focus:ring-0 p-0"
                      />
                    </div>
                    <div className="p-2 bg-white rounded border border-pink-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Immature (MI / GV)</span>
                      <input
                        type="number"
                        value={immatureOocytes}
                        onChange={(e) => setImmatureOocytes(e.target.value)}
                        className="text-2xl font-black text-amber-700 text-center w-full bg-transparent border-0 focus:ring-0 p-0"
                      />
                    </div>
                    <div className="p-2 bg-white rounded border border-pink-200 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Maturity Rate</span>
                      <span className="text-xl font-black text-slate-800">
                        {parseInt(oocytesRetrieved, 10) > 0
                          ? `${Math.round((parseInt(matureOocytes, 10) / parseInt(oocytesRetrieved, 10)) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Oocyte Quality &amp; Cytoplasm</label>
                      <textarea
                        rows={2}
                        value={oocyteQuality}
                        onChange={(e) => setOocyteQuality(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Specific Oocyte Abnormalities</label>
                      <textarea
                        rows={2}
                        value={oocyteAbnormalities}
                        onChange={(e) => setOocyteAbnormalities(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm Details &amp; Preparation</label>
                      <textarea
                        rows={2}
                        value={spermDetails}
                        onChange={(e) => setSpermDetails(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Advice on Discharge &amp; OHSS Prophylaxis</label>
                      <textarea
                        rows={2}
                        value={adviceOnDischarge}
                        onChange={(e) => setAdviceOnDischarge(e.target.value)}
                        className="vmd-input text-xs font-semibold text-rose-950"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Printable Report Preview */
            <div className="max-w-3xl mx-auto bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800">
              <div className="text-center border-b-2 border-pink-700 pb-4">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  Oocyte Pick-Up (OPU) &amp; Aspiration Operative Record
                </h1>
                <p className="text-xs text-slate-500 italic mt-0.5">
                  VaidyaMD Embryology Suite · Assisted Reproduction Clinical Record
                </p>
              </div>

              <div className="grid grid-cols-2 text-xs border border-slate-200 divide-x divide-y divide-slate-200">
                <div className="p-2.5 bg-slate-50 font-bold">Patient Name: <span className="font-normal">{patient?.name}</span></div>
                <div className="p-2.5 bg-slate-50 font-bold">VID: <span className="font-normal font-mono">{patient?.vid}</span></div>
                <div className="p-2.5">OPU Date/Time: <span className="font-semibold">{opuDateTime.replace('T', ' ')}</span></div>
                <div className="p-2.5">Operating Surgeon: <span className="font-semibold">{surgeon}</span></div>
                <div className="p-2.5">Trigger-OPU Gap: <span className="font-semibold text-blue-700">{triggerOpuDifference}</span></div>
                <div className="p-2.5">Endometrial Thickness: <span className="font-semibold text-emerald-800">{endometrialThickness}</span></div>
              </div>

              {/* Yield Box */}
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 grid grid-cols-3 text-center">
                <div>
                  <span className="text-[11px] text-pink-900 block font-bold">Total Oocytes Retrieved</span>
                  <strong className="text-2xl text-pink-700">{oocytesRetrieved}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-900 block font-bold">Mature (MII) Oocytes</span>
                  <strong className="text-2xl text-emerald-700">{matureOocytes}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-amber-900 block font-bold">Immature (MI / GV)</span>
                  <strong className="text-2xl text-amber-700">{immatureOocytes}</strong>
                </div>
              </div>

              {/* Stimulation & Hormones */}
              <div className="text-xs space-y-2 border-t pt-3">
                <p><strong>Stimulation Protocol:</strong> {stimulationProtocol} ({daysStimulation} Days)</p>
                <p><strong>Gonadotropins:</strong> {rfshDosage} + {hphmgDosage} ({totalGonadotrophinDose})</p>
                <p><strong>Trigger:</strong> {trigger} at {triggerDateTime.replace('T', ' ')}</p>
                <p><strong>Hormonal Peak:</strong> Pre-Trigger E2: {preTriggerE2} · P4: {preTriggerProgesterone}</p>
                <p><strong>Gamete Quality:</strong> {oocyteQuality}</p>
                <p><strong>Sperm Details:</strong> {spermDetails}</p>
              </div>

              {/* Discharge Advice */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Post-OPU Discharge Orders &amp; Medications:</span>
                <p className="text-slate-700 leading-relaxed">{adviceOnDischarge}</p>
              </div>

              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{surgeon}</p>
                  <p className="text-slate-500">Operating Gynaecologist</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">Senior Embryologist</p>
                  <p className="text-slate-500">Embryology Lab Witness</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                OPU aspiration report saved successfully!
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
              className="px-5 py-2 bg-pink-700 hover:bg-pink-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save OPU Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
