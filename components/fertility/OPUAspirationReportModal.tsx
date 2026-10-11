'use client';

import React, { useState, useEffect } from 'react';
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
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
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
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  // Hydrate existing saved OPU report on mount
  useEffect(() => {
    if (!patient?.id) return;
    const cycleId = resolvedCycle?.id;
    andrologyApi.list({ patient_id: patient.id, record_type: 'opu_aspiration_report' })
      .then((records: any[]) => {
        if (!Array.isArray(records) || records.length === 0) return;
        const match = cycleId ? records.find((r) => r.data?.cycle_id === cycleId) || records[0] : records[0];
        if (match && match.data) {
          setExistingRecordId(match.id);
          const d = match.data;
          if (d.report_date) setReportDate(d.report_date);
          if (d.summary) {
            if (d.summary.reason_for_art) setReasonForART(d.summary.reason_for_art);
            if (d.summary.female_factor) setFemaleFactor(d.summary.female_factor);
            if (d.summary.male_factor) setMaleFactor(d.summary.male_factor);
            if (d.summary.add_on_drugs) setAddOnDrugs(d.summary.add_on_drugs);
          }
          if (d.pre_treatments) {
            if (d.pre_treatments.protocol) setPreTreatments(d.pre_treatments.protocol);
            if (d.pre_treatments.comments) setPreTreatmentComments(d.pre_treatments.comments);
            if (d.pre_treatments.days) setDaysPreTreatment(String(d.pre_treatments.days));
            if (d.pre_treatments.lmp) setLmp(d.pre_treatments.lmp);
          }
          if (d.stimulation) {
            if (d.stimulation.protocol) setStimulationProtocol(d.stimulation.protocol);
            if (d.stimulation.days) setDaysStimulation(String(d.stimulation.days));
            if (d.stimulation.date) setStimulationDate(d.stimulation.date);
            if (d.stimulation.oral_agents) setOralStimulatingAgents(d.stimulation.oral_agents);
            if (d.stimulation.down_regulation) setDownRegulation(d.stimulation.down_regulation);
            if (d.stimulation.down_regulation_days) setDownRegulationDays(String(d.stimulation.down_regulation_days));
            if (d.stimulation.down_regulation_date) setDownRegulationDate(d.stimulation.down_regulation_date);
            if (d.stimulation.down_regulation_e2) setDownRegulationE2(d.stimulation.down_regulation_e2);
            if (d.stimulation.day2_et_mm) setDay2EndometrialThickness(d.stimulation.day2_et_mm);
          }
          if (d.hormones) {
            if (d.hormones.rfsh_dose) setRfshDosage(d.hormones.rfsh_dose);
            if (d.hormones.rlh_dose) setRlhDosage(d.hormones.rlh_dose);
            if (d.hormones.hphmg_dose) setHphmgDosage(d.hormones.hphmg_dose);
            if (d.hormones.hpfsh_dose) setHpfshDosage(d.hormones.hpfsh_dose);
            if (d.hormones.total_gonadotrophin_dose) setTotalGonadotrophinDose(d.hormones.total_gonadotrophin_dose);
            if (d.hormones.deviation) setDeviationDuringCycle(d.hormones.deviation);
            if (d.hormones.et_mm) setEndometrialThickness(d.hormones.et_mm);
            if (d.hormones.fluid_in_cavity) setFluidInCavity(d.hormones.fluid_in_cavity);
            if (d.hormones.interventions) setInterventionsDuringCycle(d.hormones.interventions);
            if (d.hormones.growth_hormone) setGrowthHormoneDosage(d.hormones.growth_hormone);
          }
          if (d.trigger) {
            if (d.trigger.agent) setTrigger(d.trigger.agent);
            if (d.trigger.comments) setTriggerComments(d.trigger.comments);
            if (d.trigger.date_time) setTriggerDateTime(d.trigger.date_time);
            if (d.trigger.repeat_12h) setRepeat12hTrigger(d.trigger.repeat_12h);
            if (d.trigger.pre_trigger_e2) setPreTriggerE2(d.trigger.pre_trigger_e2);
            if (d.trigger.pre_trigger_lh) setPreTriggerLH(d.trigger.pre_trigger_lh);
            if (d.trigger.pre_trigger_p4) setPreTriggerProgesterone(d.trigger.pre_trigger_p4);
            if (d.trigger.post_trigger_lh) setPostTriggerLH(d.trigger.post_trigger_lh);
            if (d.trigger.post_trigger_p4) setPostTriggerProgesterone(d.trigger.post_trigger_p4);
            if (d.trigger.post_trigger_bhcg) setPostTriggerBHCG(d.trigger.post_trigger_bhcg);
            if (d.trigger.trigger_day_e2) setTriggerDayE2(d.trigger.trigger_day_e2);
            if (d.trigger.trigger_day_et) setTriggerDayEndometrialThickness(d.trigger.trigger_day_et);
          }
          if (d.opu) {
            if (d.opu.date_time) setOpuDateTime(d.opu.date_time);
            if (d.opu.surgeon) setSurgeon(d.opu.surgeon);
            if (d.opu.anaesthetist) setAnaesthetist(d.opu.anaesthetist);
            if (d.opu.other_surgeons) setOtherSurgeons(d.opu.other_surgeons);
            if (d.opu.anesthesia_dose) setOpuTotalDose(d.opu.anesthesia_dose);
            if (d.opu.self_donor) setSelfDonor(d.opu.self_donor);
            if (d.opu.trigger_opu_diff_hrs) setTriggerOpuDifference(d.opu.trigger_opu_diff_hrs);
            if (d.opu.follicles_over_14) setFolliclesOver14(String(d.opu.follicles_over_14));
            if (d.opu.oocytes_retrieved) setOocytesRetrieved(String(d.opu.oocytes_retrieved));
            if (d.opu.mature_oocytes_mii) setMatureOocytes(String(d.opu.mature_oocytes_mii));
            if (d.opu.immature_oocytes) setImmatureOocytes(String(d.opu.immature_oocytes));
            if (d.opu.oocyte_quality) setOocyteQuality(d.opu.oocyte_quality);
            if (d.opu.abnormalities) setOocyteAbnormalities(d.opu.abnormalities);
            if (d.opu.freezing_plan) setFreezing(d.opu.freezing_plan);
            if (d.opu.sperm_details) setSpermDetails(d.opu.sperm_details);
            if (d.opu.advanced_technique) setAdvancedSpermTechnique(d.opu.advanced_technique);
            if (d.opu.advice_on_discharge) setAdviceOnDischarge(d.opu.advice_on_discharge);
          }
          // Default to preview mode for saved/existing records to prevent accidental edits
          setViewMode('preview');
        }
      })
      .catch((err) => console.error('Failed to load OPU report:', err));
  }, [patient?.id, resolvedCycle?.id]);

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'opu_aspiration_report',
        data: {
          report_date: reportDate,
          cycle_id: resolvedCycle?.id || null,
          cycle_code: resolvedCycle?.cycle_id || 'ART-01',
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
      setViewMode('preview');
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save OPU aspiration report');
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print:overflow-visible print:p-0 print:m-0 print:h-auto print:max-h-none">
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
                      className="vmd-input text-xs font-bold text-primary"
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
                        className="vmd-input text-xs font-bold text-primary"
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
            /* Authentic A4 Printable Report Preview */
            <div className="py-6 overflow-y-auto max-h-full flex justify-center bg-slate-100/60 print:bg-white print:p-0 print:m-0">
              <A4Sheet
                className="shadow-xl"
                header={
                  <PrintableReportHeader
                    title="Oocyte Pick-Up (OPU) & Operative Aspiration Record"
                    subtitle="Department of Reproductive Medicine & Assisted Conception · Embryology Suite"
                    badge="OPU RECORD"
                    patient={{
                      name: patient?.name || 'Female Patient',
                      vid: patient?.vid,
                    }}
                    partner={partner?.name ? { name: partner?.name } : undefined}
                    doctor={{
                      name: surgeon,
                    }}
                    metaFields={[
                      { label: 'OPU Date & Time', value: opuDateTime ? opuDateTime.replace('T', ' ') : '—' },
                      { label: 'Trigger-to-OPU Gap', value: triggerOpuDifference || '—' },
                    ]}
                  />
                }
                footer={
                  <PrintableReportFooter
                    signatoryName={surgeon || 'Operating Gynecologist'}
                    signatoryTitle="Operating ART Surgeon"
                    signatorySubtitle="Consultant Gynecologist & ART Specialist"
                    showSignatory={true}
                    witnessTitle="Senior Clinical Embryologist"
                    showWitness={true}
                    disclaimer="This document represents the operative oocyte aspiration record and gamete yield summary under the ART (Regulation) Act, 2021."
                    pageNumber={1}
                    totalPages={1}
                  />
                }
              >
                <div className="p-6 sm:p-8 space-y-5 text-slate-900 text-xs">
                  {/* Clinical & Operative Parameters Table */}
                  <table className="w-full border-collapse border border-slate-300 text-xs leading-snug">
                    <tbody>
                      <tr className="bg-slate-50 font-semibold">
                        <td className="border border-slate-300 px-3 py-1.5 w-1/4 text-slate-600">Operating Surgeon:</td>
                        <td className="border border-slate-300 px-3 py-1.5 w-1/4 font-bold text-slate-900">{surgeon || '—'}</td>
                        <td className="border border-slate-300 px-3 py-1.5 w-1/4 text-slate-600">Anaesthetist:</td>
                        <td className="border border-slate-300 px-3 py-1.5 w-1/4 font-bold text-slate-900">{anaesthetist || '—'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">Cycle ID / Indication:</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{resolvedCycle?.cycle_id || '—'} · {reasonForART || 'Infertility'}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">Endometrial Thickness:</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-emerald-800">{endometrialThickness || '—'} mm</td>
                      </tr>
                      <tr className="bg-slate-50 font-semibold">
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">Trigger Agent &amp; Time:</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{trigger || '—'} ({triggerDateTime ? triggerDateTime.replace('T', ' ') : '—'})</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">Trigger-OPU Interval:</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-primary">{triggerOpuDifference || '35.5 hrs'}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">Stimulation Protocol:</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium" colSpan={3}>
                          {stimulationProtocol || 'Antagonist Protocol'} {daysStimulation ? `(${daysStimulation} Days)` : ''} · Gonadotropins: {rfshDosage || ''} {hphmgDosage || ''} ({totalGonadotrophinDose || 'Standard'})
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Gamete Yield Summary Metrics */}
                  <div className="bg-pink-50/70 p-4 rounded-lg border border-pink-200 grid grid-cols-4 text-center">
                    <div>
                      <span className="text-[10.5px] uppercase tracking-wide text-pink-900 block font-bold">Total Oocytes (COCs)</span>
                      <strong className="text-2xl text-pink-700 font-black">{oocytesRetrieved || '0'}</strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] uppercase tracking-wide text-emerald-900 block font-bold">Mature (MII) Oocytes</span>
                      <strong className="text-2xl text-emerald-700 font-black">{matureOocytes || '0'}</strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] uppercase tracking-wide text-amber-900 block font-bold">Immature (MI / GV)</span>
                      <strong className="text-2xl text-amber-700 font-black">{immatureOocytes || '0'}</strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] uppercase tracking-wide text-slate-700 block font-bold">Maturity Rate</span>
                      <strong className="text-2xl text-slate-800 font-black">
                        {parseInt(oocytesRetrieved, 10) > 0
                          ? `${Math.round((parseInt(matureOocytes, 10) / parseInt(oocytesRetrieved, 10)) * 100)}%`
                          : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Hormonal Peak & Gamete Morphological Notes */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] border-b pb-1">
                      Endocrine Profile &amp; Gamete Morphology
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-700">
                      <div><strong className="text-slate-900">Pre-Trigger Hormones:</strong> E2: {preTriggerE2 || '—'} pg/mL · P4: {preTriggerProgesterone || '—'} ng/mL · LH: {preTriggerLH || '—'} mIU/mL</div>
                      <div><strong className="text-slate-900">Post-Trigger Check:</strong> LH: {postTriggerLH || '—'} · P4: {postTriggerProgesterone || '—'} · β-hCG: {postTriggerBHCG || '—'}</div>
                      <div><strong className="text-slate-900">Oocyte Quality &amp; Cytoplasm:</strong> {oocyteQuality || 'Normal cytoplasmic granularity'}</div>
                      <div><strong className="text-slate-900">Sperm Details &amp; Preparation:</strong> {spermDetails || 'Standard gradient separation / Swim-up'}</div>
                    </div>
                  </div>

                  {/* Discharge & OHSS Advice */}
                  {adviceOnDischarge && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wide text-[10.5px]">
                        Post-Operative Orders &amp; Discharge Prophylaxis:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{adviceOnDischarge}</p>
                    </div>
                  )}
                </div>
              </A4Sheet>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
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
