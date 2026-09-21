'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Save,
  Plus,
  Trash2,
  FileText,
  Eye,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Baby,
  Activity,
  ClipboardList,
  Check,
} from 'lucide-react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import { patientsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

export interface ClinicalHistoryProformaModalProps {
  patient: any;
  partner?: any;
  onClose: () => void;
  onSaved?: () => void;
  initialType?: 'fertility' | 'gynaecology' | 'obstetric';
}

interface ObstetricRow {
  year: string;
  place: string;
  details: string;
  outcome: string;
  gestation?: string;
  mode?: string;
  babySexWeight?: string;
}

interface MedicationRow {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function ClinicalHistoryProformaModal({
  patient,
  partner,
  onClose,
  onSaved,
  initialType = 'fertility',
}: ClinicalHistoryProformaModalProps) {
  const [activeTab, setActiveTab] = useState<'fertility' | 'gynaecology' | 'obstetric'>(initialType);
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [usePrePrintedPad, setUsePrePrintedPad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Common Header Details
  const [referredBy, setReferredBy] = useState('');
  const [livesIn, setLivesIn] = useState('');
  const [seenByDr, setSeenByDr] = useState('');
  const [staffInAttendance, setStaffInAttendance] = useState('');
  const [reasonForConsultation, setReasonForConsultation] = useState('');

  // 1. FERTILITY CONSULTATION STATE
  const [fertilityType, setFertilityType] = useState('Primary');
  const [fertilityFactor, setFertilityFactor] = useState('Couple');
  const [marriedInYear, setMarriedInYear] = useState('');
  const [tryingForPregnancy, setTryingForPregnancy] = useState('');
  const [consanguinity, setConsanguinity] = useState('Non-Consanguineous');

  // Female Partner Details
  const [femaleName, setFemaleName] = useState(patient?.name || '');
  const [femaleProfession, setFemaleProfession] = useState('');
  const [femaleWeight, setFemaleWeight] = useState(patient?.weight ? String(patient.weight) : '');
  const [femaleBmi, setFemaleBmi] = useState(patient?.bmi ? String(patient.bmi) : '');

  // Menstrual History
  const [periodsEvery, setPeriodsEvery] = useState('');
  const [durationBleeding, setDurationBleeding] = useState('');
  const [ageAtMenarche, setAgeAtMenarche] = useState('');
  const [lmp, setLmp] = useState(new Date().toISOString().split('T')[0]);
  const [periodsPainful, setPeriodsPainful] = useState('No');
  const [periodsHeavy, setPeriodsHeavy] = useState('No');
  const [menstrualAdditional, setMenstrualAdditional] = useState('');

  // Obstetric History
  const [gpal, setGpal] = useState('');
  const [obRows, setObRows] = useState<ObstetricRow[]>([
    { year: '', place: '', details: '', outcome: '', gestation: '', mode: '', babySexWeight: '' },
  ]);

  // Female Medical / Lifestyle
  const [contraceptionHistory, setContraceptionHistory] = useState('');
  const [femaleLifestyle, setFemaleLifestyle] = useState<string[]>([]);
  const [femaleCoffee, setFemaleCoffee] = useState('');
  const [femalePastMedical, setFemalePastMedical] = useState('');
  const [femaleRegularMed, setFemaleRegularMed] = useState('');
  const [historyOfTb, setHistoryOfTb] = useState('No');
  const [bleedingDisorders, setBleedingDisorders] = useState('No');
  const [galactorrhoea, setGalactorrhoea] = useState('No');
  const [allergies, setAllergies] = useState('');
  const [cervicalSmearHistory, setCervicalSmearHistory] = useState('');
  const [femalePastSurgical, setFemalePastSurgical] = useState('');
  const [femaleFamilyHistory, setFemaleFamilyHistory] = useState<string[]>([]);

  // Female Examination
  const [femalePallor, setFemalePallor] = useState('Absent');
  const [femaleBp, setFemaleBp] = useState('');
  const [paFindings, setPaFindings] = useState('');
  const [cervix, setCervix] = useState('');
  const [uterusPosition, setUterusPosition] = useState('');
  const [uterusSize, setUterusSize] = useState('');
  const [threeDScan, setThreeDScan] = useState('');

  // Male Partner Details
  const [maleName, setMaleName] = useState(partner?.name || patient?.partner_name || '');
  const [maleProfession, setMaleProfession] = useState('');
  const [maleWeight, setMaleWeight] = useState('');
  const [maleBmi, setMaleBmi] = useState('');
  const [erectionIssues, setErectionIssues] = useState('No');
  const [ejaculationIssues, setEjaculationIssues] = useState('No');
  const [frequencyIntercourse, setFrequencyIntercourse] = useState('');
  const [scrotalInjury, setScrotalInjury] = useState('No');
  const [mumpsChildhood, setMumpsChildhood] = useState('No');
  const [malePastMedical, setMalePastMedical] = useState('');
  const [maleRegularMed, setMaleRegularMed] = useState('');
  const [maleBp, setMaleBp] = useState('');

  // Fertility Investigations
  const [invAmh, setInvAmh] = useState('');
  const [invFsh, setInvFsh] = useState('');
  const [invLh, setInvLh] = useState('');
  const [invTsh, setInvTsh] = useState('');
  const [invTubalPatency, setInvTubalPatency] = useState('');
  const [invSemenAnalysis, setInvSemenAnalysis] = useState('');
  const [invDfi, setInvDfi] = useState('');

  // Advice & Foods
  const [lifestyleAdvice, setLifestyleAdvice] = useState('');
  const [fertilityFoods, setFertilityFoods] = useState<string[]>([]);

  // Medications Table
  const [femaleMeds, setFemaleMeds] = useState<MedicationRow[]>([
    {
      drug: '',
      dose: '',
      route: 'Oral',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);
  const [maleMeds, setMaleMeds] = useState<MedicationRow[]>([
    {
      drug: '',
      dose: '',
      route: 'Oral',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);
  const [treatmentProtocol, setTreatmentProtocol] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // 2. GYNAECOLOGY SPECIFIC STATE
  const [gynaeSmearResult, setGynaeSmearResult] = useState('');
  const [gynaeHpv, setGynaeHpv] = useState('');

  // 3. OBSTETRIC SPECIFIC STATE
  const [edd, setEdd] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');
  const [conceptionMode, setConceptionMode] = useState('Spontaneous');
  const [currentPregnancyNotes, setCurrentPregnancyNotes] = useState('');

  // Dynamic Row Handlers
  const addObRow = () => {
    setObRows([
      ...obRows,
      { year: '', place: '', details: '', outcome: '', gestation: '', mode: '', babySexWeight: '' },
    ]);
  };
  const removeObRow = (idx: number) => {
    if (obRows.length <= 1) return;
    setObRows(obRows.filter((_, i) => i !== idx));
  };

  const addFemaleMed = () => {
    setFemaleMeds([
      ...femaleMeds,
      { drug: '', dose: '', route: 'Oral', frequency: 'OD', duration: '30 Days', instructions: 'After food' },
    ]);
  };
  const removeFemaleMed = (idx: number) => {
    if (femaleMeds.length <= 1) return;
    setFemaleMeds(femaleMeds.filter((_, i) => i !== idx));
  };

  // Save proforma to clinical record
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient?.id,
        record_type: `clinical_proforma_${activeTab}`,
        title:
          activeTab === 'fertility'
            ? 'Fertility Consultation Proforma'
            : activeTab === 'gynaecology'
            ? 'Gynaecology Case History Proforma'
            : 'Obstetric Consultation Proforma',
        diagnosis: finalDiagnosis,
        data: {
          tab: activeTab,
          referred_by: referredBy,
          seen_by: seenByDr,
          reason: reasonForConsultation,
          female: {
            name: femaleName,
            age: patient?.age,
            weight: femaleWeight,
            bmi: femaleBmi,
            menstrual: { periodsEvery, durationBleeding, ageAtMenarche, lmp, periodsPainful, periodsHeavy },
            gpal,
            ob_history: obRows,
            medical: { past: femalePastMedical, regular_med: femaleRegularMed, allergies },
            surgical: femalePastSurgical,
            examination: { bp: femaleBp, pallor: femalePallor, pa: paFindings, cervix, uterus: uterusPosition },
          },
          male:
            activeTab === 'fertility'
              ? {
                  name: maleName,
                  profession: maleProfession,
                  weight: maleWeight,
                  bmi: maleBmi,
                  sexual: { erection: erectionIssues, ejaculation: ejaculationIssues, frequency: frequencyIntercourse },
                  medical: malePastMedical,
                  examination: { bp: maleBp },
                }
              : null,
          investigations: { amh: invAmh, semen: invSemenAnalysis, dfi: invDfi, tubal: invTubalPatency },
          treatment: { female_meds: femaleMeds, male_meds: maleMeds, protocol: treatmentProtocol },
          advice: { lifestyle: lifestyleAdvice, foods: fertilityFoods },
        },
      };

      if (patient?.id) {
        await patientsApi.createClinicalRecord(patient.id, payload);
      }
      setSaveSuccess(true);
      toast.success('Clinical Proforma Saved', 'Case history record saved to patient medical chart.');
      onSaved?.();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Unable to save proforma');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2878a8]/10 border border-[#2878a8]/20 flex items-center justify-center text-[#2878a8]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>Clinical History Proforma</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2878a8]/10 text-[#2878a8] capitalize">
                  {activeTab} Template
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{patient?.name || 'Female Patient'}</strong> ({patient?.vid || 'VID-000'})
                {partner?.name && ` · Partner: ${partner.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Proforma Type Tabs */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('fertility')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'fertility' ? 'bg-[#2878a8] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Fertility</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gynaecology')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'gynaecology' ? 'bg-[#2878a8] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Gynaecology</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('obstetric')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'obstetric' ? 'bg-[#2878a8] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>Obstetric</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form Entry
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Print Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print:overflow-visible print:p-0">
          {viewMode === 'form' ? (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Common Section 1: Consultation Metadata */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  Consultation Details &amp; Registration
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Referred By</label>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Dr. / Clinic Name"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Lives In / Location</label>
                    <input
                      type="text"
                      value={livesIn}
                      onChange={(e) => setLivesIn(e.target.value)}
                      placeholder="City / Region"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Seen By Dr.</label>
                    <input
                      type="text"
                      value={seenByDr}
                      onChange={(e) => setSeenByDr(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Staff in Attendance</label>
                    <input
                      type="text"
                      value={staffInAttendance}
                      onChange={(e) => setStaffInAttendance(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason for Consultation / Chief Complaints</label>
                    <textarea
                      rows={2}
                      value={reasonForConsultation}
                      onChange={(e) => setReasonForConsultation(e.target.value)}
                      placeholder="Primary complaints, duration of symptoms, key expectations..."
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 1: FERTILITY CONSULTATION */}
              {activeTab === 'fertility' && (
                <div className="space-y-6">
                  {/* Couple Specific Sub-block */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                      Couple Fertility Profile
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Fertility Type</label>
                        <select
                          value={fertilityType}
                          onChange={(e) => setFertilityType(e.target.value)}
                          className="vmd-input text-xs"
                        >
                          <option value="Primary">Primary Infertility</option>
                          <option value="Secondary">Secondary Infertility</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Factor</label>
                        <select
                          value={fertilityFactor}
                          onChange={(e) => setFertilityFactor(e.target.value)}
                          className="vmd-input text-xs"
                        >
                          <option value="Female">Female Factor</option>
                          <option value="Male">Male Factor</option>
                          <option value="Couple">Combined Couple</option>
                          <option value="Unexplained">Unexplained</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Married In Year</label>
                        <input
                          type="number"
                          value={marriedInYear}
                          onChange={(e) => setMarriedInYear(e.target.value)}
                          placeholder="YYYY"
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Trying for Pregnancy</label>
                        <input
                          type="text"
                          value={tryingForPregnancy}
                          onChange={(e) => setTryingForPregnancy(e.target.value)}
                          placeholder="e.g. 2 yrs"
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Consanguinity</label>
                        <select
                          value={consanguinity}
                          onChange={(e) => setConsanguinity(e.target.value)}
                          className="vmd-input text-xs"
                        >
                          <option value="Non-Consanguineous">Non-Consanguineous</option>
                          <option value="Consanguineous">Consanguineous</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Female Partner Section */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] border-b pb-2">
                      1. Female Partner Assessment
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Female Name</label>
                        <input
                          type="text"
                          value={femaleName}
                          onChange={(e) => setFemaleName(e.target.value)}
                          className="vmd-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Profession</label>
                        <input
                          type="text"
                          value={femaleProfession}
                          onChange={(e) => setFemaleProfession(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={femaleWeight}
                          onChange={(e) => setFemaleWeight(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">BMI</label>
                        <input
                          type="number"
                          step="0.1"
                          value={femaleBmi}
                          onChange={(e) => setFemaleBmi(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>

                    {/* Menstrual History */}
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-700">Menstrual Cycle History</span>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500">Cycle (Days)</label>
                          <input
                            type="text"
                            value={periodsEvery}
                            onChange={(e) => setPeriodsEvery(e.target.value)}
                            placeholder="Every 28-30 d"
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Bleeding (Days)</label>
                          <input
                            type="text"
                            value={durationBleeding}
                            onChange={(e) => setDurationBleeding(e.target.value)}
                            placeholder="4-5 days"
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Age Menarche</label>
                          <input
                            type="text"
                            value={ageAtMenarche}
                            onChange={(e) => setAgeAtMenarche(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">LMP</label>
                          <input
                            type="date"
                            value={lmp}
                            onChange={(e) => setLmp(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Periods Painful?</label>
                          <select
                            value={periodsPainful}
                            onChange={(e) => setPeriodsPainful(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes (Dysmenorrhoea)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Periods Heavy?</label>
                          <select
                            value={periodsHeavy}
                            onChange={(e) => setPeriodsHeavy(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes (Menorrhagia)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Obstetric History */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-slate-700">
                          Obstetric History (G / P / L / A / D)
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={gpal}
                            onChange={(e) => setGpal(e.target.value)}
                            className="vmd-input text-xs font-mono font-bold w-36 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={addObRow}
                            className="px-2 py-0.5 bg-[#2878a8] text-white rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Row
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-xs">
                          <thead className="bg-[#2878a8]/10 text-[#2878a8] font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2 text-left">Year</th>
                              <th className="p-2 text-left">Place / Hospital</th>
                              <th className="p-2 text-left">Treatment / Mode</th>
                              <th className="p-2 text-left">Outcome</th>
                              <th className="p-2 text-center w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {obRows.map((r, i) => (
                              <tr key={i}>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={r.year}
                                    onChange={(e) => {
                                      const updated = [...obRows];
                                      updated[i].year = e.target.value;
                                      setObRows(updated);
                                    }}
                                    placeholder="2022"
                                    className="vmd-input text-xs py-1"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={r.place}
                                    onChange={(e) => {
                                      const updated = [...obRows];
                                      updated[i].place = e.target.value;
                                      setObRows(updated);
                                    }}
                                    placeholder="City / Hospital"
                                    className="vmd-input text-xs py-1"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={r.details}
                                    onChange={(e) => {
                                      const updated = [...obRows];
                                      updated[i].details = e.target.value;
                                      setObRows(updated);
                                    }}
                                    placeholder="Spontaneous / IVF"
                                    className="vmd-input text-xs py-1"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={r.outcome}
                                    onChange={(e) => {
                                      const updated = [...obRows];
                                      updated[i].outcome = e.target.value;
                                      setObRows(updated);
                                    }}
                                    placeholder="Full term / Miscarriage"
                                    className="vmd-input text-xs py-1"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeObRow(i)}
                                    disabled={obRows.length <= 1}
                                    className="text-slate-400 hover:text-rose-600 disabled:opacity-20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Examination Findings */}
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                      <span className="text-[11px] font-bold uppercase text-slate-700">
                        Female Clinical &amp; Gynaecological Examination
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500">Pallor</label>
                          <select
                            value={femalePallor}
                            onChange={(e) => setFemalePallor(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="Absent">Absent</option>
                            <option value="Present">Present</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Blood Pressure</label>
                          <input
                            type="text"
                            value={femaleBp}
                            onChange={(e) => setFemaleBp(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">P/A Abdomen</label>
                          <input
                            type="text"
                            value={paFindings}
                            onChange={(e) => setPaFindings(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Cervix Inspection</label>
                          <select
                            value={cervix}
                            onChange={(e) => setCervix(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="Healthy">Healthy</option>
                            <option value="Erosion">Cervical Erosion</option>
                            <option value="Polyp">Polyp</option>
                            <option value="Abnormal">Abnormal Discharge</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Uterus Position</label>
                          <select
                            value={uterusPosition}
                            onChange={(e) => setUterusPosition(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="Anteverted">Anteverted (AV)</option>
                            <option value="Retroverted">Retroverted (RV)</option>
                            <option value="Mid-position">Mid-position</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Uterus Size &amp; Mobility</label>
                          <input
                            type="text"
                            value={uterusSize}
                            onChange={(e) => setUterusSize(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500">3-D Pelvic Scan Findings</label>
                          <input
                            type="text"
                            value={threeDScan}
                            onChange={(e) => setThreeDScan(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Male Partner Section */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] border-b pb-2">
                      2. Male Partner Assessment
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Male Name</label>
                        <input
                          type="text"
                          value={maleName}
                          onChange={(e) => setMaleName(e.target.value)}
                          className="vmd-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Profession</label>
                        <input
                          type="text"
                          value={maleProfession}
                          onChange={(e) => setMaleProfession(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={maleWeight}
                          onChange={(e) => setMaleWeight(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">BMI</label>
                        <input
                          type="number"
                          step="0.1"
                          value={maleBmi}
                          onChange={(e) => setMaleBmi(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-700">Male Sexual &amp; Andrology History</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500">Erection Difficulty?</label>
                          <select
                            value={erectionIssues}
                            onChange={(e) => setErectionIssues(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No (Normal)</option>
                            <option value="Yes">Yes (ED)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Ejaculation Difficulty?</label>
                          <select
                            value={ejaculationIssues}
                            onChange={(e) => setEjaculationIssues(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No (Normal)</option>
                            <option value="Yes">Yes (PE / Retrograde)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Coital Frequency</label>
                          <input
                            type="text"
                            value={frequencyIntercourse}
                            onChange={(e) => setFrequencyIntercourse(e.target.value)}
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Childhood Mumps?</label>
                          <select
                            value={mumpsChildhood}
                            onChange={(e) => setMumpsChildhood(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Groin/Scrotal Injury?</label>
                          <select
                            value={scrotalInjury}
                            onChange={(e) => setScrotalInjury(e.target.value)}
                            className="vmd-input text-xs"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fertility Investigations Overview */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] border-b pb-2">
                      3. Fertility Baseline Investigations
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Serum AMH</label>
                        <input
                          type="text"
                          value={invAmh}
                          onChange={(e) => setInvAmh(e.target.value)}
                          className="vmd-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">FSH / LH / TSH</label>
                        <input
                          type="text"
                          value={`${invFsh} | ${invLh} | ${invTsh}`}
                          onChange={(e) => setInvFsh(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Tubal Patency (HSG/HyCoSy)</label>
                        <input
                          type="text"
                          value={invTubalPatency}
                          onChange={(e) => setInvTubalPatency(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Semen Analysis / DFI</label>
                        <input
                          type="text"
                          value={invDfi ? `${invSemenAnalysis} (DFI: ${invDfi})` : invSemenAnalysis}
                          onChange={(e) => setInvSemenAnalysis(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Treatments Table */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                        4. Planned Medications &amp; Treatment Protocol
                      </h3>
                      <button
                        type="button"
                        onClick={addFemaleMed}
                        className="px-2.5 py-1 bg-[#2878a8] text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Female Medication
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-[#2878a8]/10 text-[#2878a8] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2 text-left">Drug Name</th>
                            <th className="p-2 text-left">Dose</th>
                            <th className="p-2 text-left">Route</th>
                            <th className="p-2 text-left">Frequency</th>
                            <th className="p-2 text-left">Duration</th>
                            <th className="p-2 text-left">Instructions</th>
                            <th className="p-2 text-center w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {femaleMeds.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.drug}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].drug = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs font-semibold py-1"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.dose}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].dose = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs py-1"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.route}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].route = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs py-1"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.frequency}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].frequency = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs py-1"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.duration}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].duration = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs py-1"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={m.instructions}
                                  onChange={(e) => {
                                    const updated = [...femaleMeds];
                                    updated[idx].instructions = e.target.value;
                                    setFemaleMeds(updated);
                                  }}
                                  className="vmd-input text-xs py-1"
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeFemaleMed(idx)}
                                  disabled={femaleMeds.length <= 1}
                                  className="text-slate-400 hover:text-rose-600 disabled:opacity-20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GYNAECOLOGY CASE HISTORY */}
              {activeTab === 'gynaecology' && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] border-b pb-2">
                      Gynaecology Symptomatology &amp; Examination
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Age at Menarche</label>
                        <input
                          type="text"
                          value={ageAtMenarche}
                          onChange={(e) => setAgeAtMenarche(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">LMP</label>
                        <input
                          type="date"
                          value={lmp}
                          onChange={(e) => setLmp(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Smear Result</label>
                        <input
                          type="text"
                          value={gynaeSmearResult}
                          onChange={(e) => setGynaeSmearResult(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">HPV Status</label>
                        <select
                          value={gynaeHpv}
                          onChange={(e) => setGynaeHpv(e.target.value)}
                          className="vmd-input text-xs"
                        >
                          <option value="Negative">Negative</option>
                          <option value="Positive">Positive</option>
                          <option value="Not done">Not done</option>
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Menstrual Bleeding Pattern &amp; Abnormalities</label>
                        <textarea
                          rows={2}
                          value={menstrualAdditional}
                          onChange={(e) => setMenstrualAdditional(e.target.value)}
                          placeholder="Intermenstrual bleeding, postcoital bleeding, clots, dysmenorrhoea severity..."
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OBSTETRIC HISTORY */}
              {activeTab === 'obstetric' && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] border-b pb-2">
                      Antenatal / Current Pregnancy Profile
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">LMP</label>
                        <input
                          type="date"
                          value={lmp}
                          onChange={(e) => setLmp(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">EDD</label>
                        <input
                          type="date"
                          value={edd}
                          onChange={(e) => setEdd(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Gestational Age</label>
                        <input
                          type="text"
                          value={gestationalAge}
                          onChange={(e) => setGestationalAge(e.target.value)}
                          className="vmd-input text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Conception Mode</label>
                        <select
                          value={conceptionMode}
                          onChange={(e) => setConceptionMode(e.target.value)}
                          className="vmd-input text-xs"
                        >
                          <option value="Spontaneous">Spontaneous</option>
                          <option value="IUI">IUI</option>
                          <option value="IVF / ICSI">IVF / ICSI</option>
                          <option value="FET">FET</option>
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Current Pregnancy Progress &amp; Symptoms</label>
                        <textarea
                          rows={2}
                          value={currentPregnancyNotes}
                          onChange={(e) => setCurrentPregnancyNotes(e.target.value)}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Section 5: Diagnosis & Final Clinical Impression */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  Clinical Diagnosis &amp; Consultation Summary
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    placeholder="Enter definitive or provisional diagnosis..."
                    className="vmd-input text-xs font-bold text-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Consulting Physician</label>
                      <input
                        type="text"
                        value={seenByDr}
                        onChange={(e) => setSeenByDr(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW MODE: Standardized Printable Clinical Sheet */
            <div className="printable-document max-w-4xl mx-auto bg-white p-6 sm:p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0">
              <PrintableReportHeader
                title={
                  activeTab === 'fertility'
                    ? 'COUPLE FERTILITY ASSESSMENT & CASE PROFORMA'
                    : activeTab === 'gynaecology'
                    ? 'GYNAECOLOGY CLINICAL CASE HISTORY & PROFORMA'
                    : 'OBSTETRIC ANTENATAL CONSULTATION RECORD'
                }
                subtitle="Department of Reproductive Medicine, Obstetrics & Gynaecology"
                hideHospitalHeader={usePrePrintedPad}
                onTogglePrePrintedPad={() => setUsePrePrintedPad(!usePrePrintedPad)}
                patient={{
                  name: femaleName || patient?.name,
                  vid: patient?.vid,
                  age: patient?.age,
                  gender: 'Female',
                  partner_name: maleName || partner?.name || patient?.partner_name,
                }}
                metaFields={[
                  { label: 'Date', value: new Date().toISOString().split('T')[0] },
                  { label: 'Consultant', value: seenByDr },
                  { label: 'Proforma Type', value: `${activeTab.toUpperCase()} CONSULTATION` },
                  { label: 'Referred By', value: referredBy || 'Self / Direct Walk-in' },
                ]}
              />

              {/* Clinical History Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1.5 font-bold uppercase tracking-wider">
                  1. Clinical History &amp; Vitals
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className="p-1">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Weight / BMI</span>
                    <strong>{femaleWeight} kg / {femaleBmi}</strong>
                  </div>
                  <div className="p-1 sm:pl-3">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Pressure</span>
                    <strong>{femaleBp} mm Hg</strong>
                  </div>
                  <div className="p-1 sm:pl-3">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Menstrual History</span>
                    <strong>Every {periodsEvery}d / {durationBleeding}d (LMP: {lmp})</strong>
                  </div>
                  <div className="p-1 sm:pl-3">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Obstetric Summary</span>
                    <strong>{gpal}</strong>
                  </div>
                </div>
              </div>

              {/* Obstetric Table if populated */}
              {obRows.some((r) => r.year || r.place) && (
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Past Pregnancy Records</h4>
                  <table className="w-full text-xs border-collapse border border-slate-200 text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 border border-slate-200">Year</th>
                        <th className="p-2 border border-slate-200">Place / Hospital</th>
                        <th className="p-2 border border-slate-200">Treatment / Mode</th>
                        <th className="p-2 border border-slate-200">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obRows.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 border border-slate-200 font-semibold">{r.year || '—'}</td>
                          <td className="p-2 border border-slate-200">{r.place || '—'}</td>
                          <td className="p-2 border border-slate-200">{r.details || '—'}</td>
                          <td className="p-2 border border-slate-200">{r.outcome || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Fertility Couple Details */}
              {activeTab === 'fertility' && (
                <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                  <div className="bg-[#2878a8]/10 text-[#2878a8] px-3 py-1.5 font-bold uppercase tracking-wider">
                    2. Couple Fertility Assessment &amp; Baseline Metrics
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Infertility Type</span>
                      <strong>{fertilityType} ({tryingForPregnancy})</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Serum AMH</span>
                      <strong>{invAmh}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Tubal Patency</span>
                      <strong>{invTubalPatency}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Semen Parameters</span>
                      <strong>{invSemenAnalysis}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Table */}
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Prescribed Regimen &amp; Medications</h4>
                <table className="w-full text-xs border-collapse border border-slate-200 text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-200">Drug</th>
                      <th className="p-2 border border-slate-200">Dose</th>
                      <th className="p-2 border border-slate-200">Route</th>
                      <th className="p-2 border border-slate-200">Frequency</th>
                      <th className="p-2 border border-slate-200">Duration</th>
                      <th className="p-2 border border-slate-200">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {femaleMeds.map((m, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-slate-200 font-bold">{m.drug || '—'}</td>
                        <td className="p-2 border border-slate-200">{m.dose}</td>
                        <td className="p-2 border border-slate-200">{m.route}</td>
                        <td className="p-2 border border-slate-200">{m.frequency}</td>
                        <td className="p-2 border border-slate-200">{m.duration}</td>
                        <td className="p-2 border border-slate-200">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Diagnosis Banner */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Clinical Diagnosis</span>
                <strong className="text-sm text-slate-900">{finalDiagnosis}</strong>
                {lifestyleAdvice && <p className="text-slate-600 mt-1">{lifestyleAdvice}</p>}
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{femaleName || patient?.name}</p>
                  <p className="text-slate-500">Patient Attestation</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{seenByDr}</p>
                  <p className="text-slate-500">Consultant Gynecologist / Fertility Specialist</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Clinical proforma saved to medical chart!
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
                <Printer className="w-3.5 h-3.5" /> Print Proforma
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-[#2878a8] hover:bg-[#20638c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Proforma Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
