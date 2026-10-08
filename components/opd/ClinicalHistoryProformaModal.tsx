'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  ArrowRight,
  Stethoscope,
  Info,
  Layers,
  Edit3,
  FlaskConical,
} from 'lucide-react';
import { patientsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

import {
  generateProformaNarrative,
  generatePresentHistoryNarrative,
  generatePastHistoryNarrative,
  generateExaminationNarrative,
  ProformaSentenceView,
  ProformaPrintView,
  ProformaHeaderSection,
  ProformaCoupleSection,
  ProformaFemaleSection,
  ProformaMaleSection,
  ProformaInvestigationsSection,
  ProformaExamSection,
  ProformaPlanSection,
  ProformaSpecialtySections,
} from './proforma';
import type {
  ClinicalHistoryProformaModalProps,
  ObstetricRow,
  MedicationRow,
} from './proforma';

export { generateProformaNarrative };
export type { ClinicalHistoryProformaModalProps };


// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ClinicalHistoryProformaModal({
  patient,
  partner,
  onClose,
  onSaved,
  initialType = 'fertility',
  inline = false,
  onDataChange,
  initialData,
}: ClinicalHistoryProformaModalProps) {
  const [activeTab, setActiveTab] = useState<'fertility' | 'gynaecology' | 'obstetric'>(
    initialData?.activeTab || initialType
  );

  useEffect(() => {
    if (initialType && (initialType === 'fertility' || initialType === 'gynaecology' || initialType === 'obstetric')) {
      setActiveTab(initialType);
    }
  }, [initialType]);
  // View Modes: Form Entry, Readable Sentence Form, Print Preview
  const [viewMode, setViewMode] = useState<'form' | 'sentence' | 'preview'>('form');
  const [usePrePrintedPad, setUsePrePrintedPad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedNarrative, setCopiedNarrative] = useState(false);

  // 1. Demographics & Header
  const [referredBy, setReferredBy] = useState(initialData?.referredBy || '');
  const [livesIn, setLivesIn] = useState(initialData?.livesIn || '');
  const [seenByDr, setSeenByDr] = useState(initialData?.seenByDr || '');
  const [staffInAttendance, setStaffInAttendance] = useState(initialData?.staffInAttendance || '');
  const [reasonForConsultation, setReasonForConsultation] = useState(
    initialData?.reasonForConsultation || ''
  );

  // 2. Couple Fertility Profile
  const [fertilityType, setFertilityType] = useState(initialData?.fertilityType || '');
  const [fertilityFactor, setFertilityFactor] = useState(initialData?.fertilityFactor || '');
  const [marriedInYear, setMarriedInYear] = useState(initialData?.marriedInYear || '');
  const [tryingForPregnancy, setTryingForPregnancy] = useState(initialData?.tryingForPregnancy || '');
  const [consanguinity, setConsanguinity] = useState(
    initialData?.consanguinity || ''
  );

  // 3. Female Partner
  const [femaleName, setFemaleName] = useState(initialData?.femaleName || patient?.name || '');
  const [femaleProfession, setFemaleProfession] = useState(initialData?.femaleProfession || '');
  const [femaleWeight, setFemaleWeight] = useState(
    initialData?.femaleWeight || (patient?.weight ? String(patient.weight) : '')
  );
  const [femaleBmi, setFemaleBmi] = useState(
    initialData?.femaleBmi || (patient?.bmi ? String(patient.bmi) : '')
  );

  // Menstrual History
  const [periodsEvery, setPeriodsEvery] = useState(initialData?.periodsEvery || '');
  const [durationBleeding, setDurationBleeding] = useState(initialData?.durationBleeding || '');
  const [periodsPainful, setPeriodsPainful] = useState(initialData?.periodsPainful || '');
  const [periodsHeavy, setPeriodsHeavy] = useState(initialData?.periodsHeavy || '');
  const [ageAtMenarche, setAgeAtMenarche] = useState(initialData?.ageAtMenarche || '');
  const [lmp, setLmp] = useState(initialData?.lmp || '');
  const [menstrualAdditional, setMenstrualAdditional] = useState(
    initialData?.menstrualAdditional || ''
  );

  // Obstetric History
  const [gpal, setGpal] = useState(initialData?.gpal || '');
  const [obRows, setObRows] = useState<ObstetricRow[]>(
    initialData?.obRows || []
  );

  // Contraception History
  const [contraceptionHistory, setContraceptionHistory] = useState(
    initialData?.contraceptionHistory || ''
  );

  // Female Habits
  const [femaleSmoking, setFemaleSmoking] = useState(initialData?.femaleSmoking || '');
  const [femaleGutka, setFemaleGutka] = useState(initialData?.femaleGutka || '');
  const [femaleAlcohol, setFemaleAlcohol] = useState(initialData?.femaleAlcohol || '');
  const [femaleToddy, setFemaleToddy] = useState(initialData?.femaleToddy || '');
  const [femaleCoffee, setFemaleCoffee] = useState(initialData?.femaleCoffee || '');

  // Female Past Medical History
  const [femaleAdmissions, setFemaleAdmissions] = useState(initialData?.femaleAdmissions || '');
  const [femaleRegularMed, setFemaleRegularMed] = useState(initialData?.femaleRegularMed || '');
  const [femaleTb, setFemaleTb] = useState(initialData?.femaleTb || '');
  const [femaleBleedingDisorders, setFemaleBleedingDisorders] = useState(
    initialData?.femaleBleedingDisorders || ''
  );
  const [femaleGalactorrhoea, setFemaleGalactorrhoea] = useState(
    initialData?.femaleGalactorrhoea || ''
  );
  const [femaleAllergies, setFemaleAllergies] = useState(
    initialData?.femaleAllergies || ''
  );
  const [femaleCervicalSmear, setFemaleCervicalSmear] = useState(
    initialData?.femaleCervicalSmear || ''
  );

  // Female Past Surgical History
  const [femalePastSurgical, setFemalePastSurgical] = useState(
    initialData?.femalePastSurgical || ''
  );

  // Female Family History
  const [femaleFamilyHistory, setFemaleFamilyHistory] = useState<string[]>(
    initialData?.femaleFamilyHistory || []
  );

  // Female Examination
  const [femalePallor, setFemalePallor] = useState(initialData?.femalePallor || '');
  const [femalePedalEdema, setFemalePedalEdema] = useState(initialData?.femalePedalEdema || '');
  const [femaleGoitre, setFemaleGoitre] = useState(initialData?.femaleGoitre || '');
  const [femaleBp, setFemaleBp] = useState(initialData?.femaleBp || '');

  // 4. Male Partner Details
  const [maleName, setMaleName] = useState(
    initialData?.maleName || partner?.name || patient?.partner_name || ''
  );
  const [maleProfession, setMaleProfession] = useState(initialData?.maleProfession || '');
  const [maleWeight, setMaleWeight] = useState(initialData?.maleWeight || '');
  const [maleBmi, setMaleBmi] = useState(initialData?.maleBmi || '');
  const [maleErectileIssues, setMaleErectileIssues] = useState(
    initialData?.maleErectileIssues || ''
  );
  const [frequencyIntercourse, setFrequencyIntercourse] = useState(
    initialData?.frequencyIntercourse || ''
  );
  const [maleDyspareunia, setMaleDyspareunia] = useState(initialData?.maleDyspareunia || '');
  const [maleLastSi, setMaleLastSi] = useState(initialData?.maleLastSi || '');
  const [maleScrotalInjury, setMaleScrotalInjury] = useState(initialData?.maleScrotalInjury || '');
  const [maleMumps, setMaleMumps] = useState(initialData?.maleMumps || '');

  // Male Habits
  const [maleSmoking, setMaleSmoking] = useState(initialData?.maleSmoking || '');
  const [maleGutka, setMaleGutka] = useState(initialData?.maleGutka || '');
  const [maleAlcohol, setMaleAlcohol] = useState(initialData?.maleAlcohol || '');
  const [maleToddy, setMaleToddy] = useState(initialData?.maleToddy || '');
  const [maleCoffee, setMaleCoffee] = useState(initialData?.maleCoffee || '');

  // Male Past Medical History
  const [maleAdmissions, setMaleAdmissions] = useState(initialData?.maleAdmissions || '');
  const [maleRegularMed, setMaleRegularMed] = useState(initialData?.maleRegularMed || '');
  const [maleTb, setMaleTb] = useState(initialData?.maleTb || '');
  const [maleAllergies, setMaleAllergies] = useState(initialData?.maleAllergies || '');

  // Male Past Surgical History
  const [malePastSurgical, setMalePastSurgical] = useState(initialData?.malePastSurgical || '');

  // Male Family History
  const [maleFamilyHistory, setMaleFamilyHistory] = useState<string[]>(
    initialData?.maleFamilyHistory || []
  );

  // Male Examination
  const [malePallor, setMalePallor] = useState(initialData?.malePallor || '');
  const [malePedalEdema, setMalePedalEdema] = useState(initialData?.malePedalEdema || '');
  const [maleGoitre, setMaleGoitre] = useState(initialData?.maleGoitre || '');
  const [maleBp, setMaleBp] = useState(initialData?.maleBp || '');

  // 5. Fertility Investigations
  const [invAmh, setInvAmh] = useState(initialData?.invAmh || '');
  const [invFsh, setInvFsh] = useState(initialData?.invFsh || '');
  const [invLh, setInvLh] = useState(initialData?.invLh || '');
  const [invTsh, setInvTsh] = useState(initialData?.invTsh || '');
  const [invTubalPatency, setInvTubalPatency] = useState(initialData?.invTubalPatency || '');
  const [invHysteroLap, setInvHysteroLap] = useState(initialData?.invHysteroLap || '');
  const [invSemenAnalysis, setInvSemenAnalysis] = useState(initialData?.invSemenAnalysis || '');
  const [invDfi, setInvDfi] = useState(initialData?.invDfi || '');

  // 6. Fertility Treatments (Past)
  const [fertilityTreatments, setFertilityTreatments] = useState(
    initialData?.fertilityTreatments || ''
  );

  // 7. Consultation Notes & Examination
  const [fertilityCounselingDone, setFertilityCounselingDone] = useState(
    initialData?.fertilityCounselingDone ?? false
  );
  const [paFindings, setPaFindings] = useState(initialData?.paFindings || '');
  const [paScars, setPaScars] = useState(initialData?.paScars || '');
  const [psVulvaVagina, setPsVulvaVagina] = useState(initialData?.psVulvaVagina || '');
  const [psCervixHealthy, setPsCervixHealthy] = useState<boolean | null>(
    initialData?.psCervixHealthy ?? null
  );
  const [psCervixEctropion, setPsCervixEctropion] = useState(
    initialData?.psCervixEctropion ?? false
  );
  const [psCervicalSmearDone, setPsCervicalSmearDone] = useState(
    initialData?.psCervicalSmearDone ?? false
  );
  const [psBleedingOnTouch, setPsBleedingOnTouch] = useState(
    initialData?.psBleedingOnTouch ?? false
  );

  const [pvUterusPosition, setPvUterusPosition] = useState(
    initialData?.pvUterusPosition || ''
  );
  const [pvUterusSize, setPvUterusSize] = useState(initialData?.pvUterusSize || '');
  const [pvUterusMobility, setPvUterusMobility] = useState(
    initialData?.pvUterusMobility || ''
  );
  const [pvFornicesTenderness, setPvFornicesTenderness] = useState(
    initialData?.pvFornicesTenderness || ''
  );

  const [threeDScan, setThreeDScan] = useState(
    initialData?.threeDScan || ''
  );
  const [factorsInFavour, setFactorsInFavour] = useState(
    initialData?.factorsInFavour || ''
  );
  const [factorsNotInFavour, setFactorsNotInFavour] = useState(
    initialData?.factorsNotInFavour || ''
  );

  // 8. Recommended Basic Investigations Checklists
  const defaultWifeTests = ['AMH', 'RBS', 'TSH', 'TPO', 'PRL', 'Rubella IgG', 'HbA1C'];
  const defaultHusbandTests = ['TSH', 'RBS', 'PRL', 'HbA1C'];
  const defaultPendingHusband = [
    'Blood group',
    'Rh typing',
    'CBP',
    'LFT',
    'CUE',
    'HepB',
    'HepC',
    'HIV',
    'VDRL',
  ];
  const defaultPendingWife = [
    'Blood group',
    'Rh typing',
    'CBP',
    'ESR',
    'LFT',
    'Electrolytes',
    'Urea',
    'Creatinine',
    'PT',
    'APTT',
    'INR',
    'Hb Electrophoresis',
    'CUE',
    'HepB',
    'HepC',
    'HIV',
    'VDRL',
    'Chest X Ray',
    'ECG',
    '2D ECHO',
    'HyCoSy + Cervical Smear',
  ];

  const [recommendedWifeTests, setRecommendedWifeTests] = useState<string[]>(
    initialData?.recommendedWifeTests || []
  );
  const [recommendedHusbandTests, setRecommendedHusbandTests] = useState<string[]>(
    initialData?.recommendedHusbandTests || []
  );
  const [recSemenAnalysis, setRecSemenAnalysis] = useState(
    initialData?.recSemenAnalysis ?? false
  );
  const [recDfi, setRecDfi] = useState(initialData?.recDfi ?? false);
  const [pendingHusbandTests, setPendingHusbandTests] = useState<string[]>(
    initialData?.pendingHusbandTests || []
  );
  const [pendingWifeTests, setPendingWifeTests] = useState<string[]>(
    initialData?.pendingWifeTests || []
  );

  // 9. Advised Foods & Plan
  const defaultFoods = [
    'Almonds',
    'Sunflower seeds',
    'Carrots',
    'Tomatoes',
    'Citrus fruits',
    'Green leafy vegetables',
    'Egg white',
    'Garlic',
    'Dark chocolate',
  ];
  const [fertilityFoods, setFertilityFoods] = useState<string[]>(
    initialData?.fertilityFoods || []
  );
  const [fertilitySupplements, setFertilitySupplements] = useState(
    initialData?.fertilitySupplements || ''
  );
  const [followUpPlan, setFollowUpPlan] = useState(
    initialData?.followUpPlan || ''
  );
  const [finalDiagnosis, setFinalDiagnosis] = useState(
    initialData?.finalDiagnosis || ''
  );

  // Gynaecology Specific
  const [gynaeSmearResult, setGynaeSmearResult] = useState(initialData?.gynaeSmearResult || '');
  const [gynaeHpv, setGynaeHpv] = useState(initialData?.gynaeHpv || '');

  // Obstetric Specific
  const [edd, setEdd] = useState(initialData?.edd || '');
  const [gestationalAge, setGestationalAge] = useState(initialData?.gestationalAge || '');
  const [conceptionMode, setConceptionMode] = useState(
    initialData?.conceptionMode || ''
  );
  const [currentPregnancyNotes, setCurrentPregnancyNotes] = useState(
    initialData?.currentPregnancyNotes || ''
  );

  // Row handlers
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

  // Compile entire payload snapshot
  const currentPayload = useMemo(
    () => ({
      activeTab,
      referredBy,
      livesIn,
      seenByDr,
      staffInAttendance,
      reasonForConsultation,
      fertilityType,
      fertilityFactor,
      marriedInYear,
      tryingForPregnancy,
      consanguinity,
      femaleName,
      femaleProfession,
      femaleWeight,
      femaleBmi,
      periodsEvery,
      durationBleeding,
      periodsPainful,
      periodsHeavy,
      ageAtMenarche,
      lmp,
      menstrualAdditional,
      gpal,
      obRows,
      contraceptionHistory,
      femaleSmoking,
      femaleGutka,
      femaleAlcohol,
      femaleToddy,
      femaleCoffee,
      femaleAdmissions,
      femaleRegularMed,
      femaleTb,
      femaleBleedingDisorders,
      femaleGalactorrhoea,
      femaleAllergies,
      femaleCervicalSmear,
      femalePastSurgical,
      femaleFamilyHistory,
      femalePallor,
      femalePedalEdema,
      femaleGoitre,
      femaleBp,
      maleName,
      maleProfession,
      maleWeight,
      maleBmi,
      maleErectileIssues,
      frequencyIntercourse,
      maleDyspareunia,
      maleLastSi,
      maleScrotalInjury,
      maleMumps,
      maleSmoking,
      maleGutka,
      maleAlcohol,
      maleToddy,
      maleCoffee,
      maleAdmissions,
      maleRegularMed,
      maleTb,
      maleAllergies,
      malePastSurgical,
      maleFamilyHistory,
      malePallor,
      malePedalEdema,
      maleGoitre,
      maleBp,
      invAmh,
      invFsh,
      invLh,
      invTsh,
      invTubalPatency,
      invHysteroLap,
      invSemenAnalysis,
      invDfi,
      fertilityTreatments,
      fertilityCounselingDone,
      paFindings,
      paScars,
      psVulvaVagina,
      psCervixHealthy,
      psCervixEctropion,
      psCervicalSmearDone,
      psBleedingOnTouch,
      pvUterusPosition,
      pvUterusSize,
      pvUterusMobility,
      pvFornicesTenderness,
      threeDScan,
      factorsInFavour,
      factorsNotInFavour,
      recommendedWifeTests,
      recommendedHusbandTests,
      recSemenAnalysis,
      recDfi,
      pendingHusbandTests,
      pendingWifeTests,
      fertilityFoods,
      fertilitySupplements,
      followUpPlan,
      finalDiagnosis,
      gynaeSmearResult,
      gynaeHpv,
      edd,
      gestationalAge,
      conceptionMode,
      currentPregnancyNotes,
    }),
    [
      activeTab,
      referredBy,
      livesIn,
      seenByDr,
      staffInAttendance,
      reasonForConsultation,
      fertilityType,
      fertilityFactor,
      marriedInYear,
      tryingForPregnancy,
      consanguinity,
      femaleName,
      femaleProfession,
      femaleWeight,
      femaleBmi,
      periodsEvery,
      durationBleeding,
      periodsPainful,
      periodsHeavy,
      ageAtMenarche,
      lmp,
      menstrualAdditional,
      gpal,
      obRows,
      contraceptionHistory,
      femaleSmoking,
      femaleGutka,
      femaleAlcohol,
      femaleToddy,
      femaleCoffee,
      femaleAdmissions,
      femaleRegularMed,
      femaleTb,
      femaleBleedingDisorders,
      femaleGalactorrhoea,
      femaleAllergies,
      femaleCervicalSmear,
      femalePastSurgical,
      femaleFamilyHistory,
      femalePallor,
      femalePedalEdema,
      femaleGoitre,
      femaleBp,
      maleName,
      maleProfession,
      maleWeight,
      maleBmi,
      maleErectileIssues,
      frequencyIntercourse,
      maleDyspareunia,
      maleLastSi,
      maleScrotalInjury,
      maleMumps,
      maleSmoking,
      maleGutka,
      maleAlcohol,
      maleToddy,
      maleCoffee,
      maleAdmissions,
      maleRegularMed,
      maleTb,
      maleAllergies,
      malePastSurgical,
      maleFamilyHistory,
      malePallor,
      malePedalEdema,
      maleGoitre,
      maleBp,
      invAmh,
      invFsh,
      invLh,
      invTsh,
      invTubalPatency,
      invHysteroLap,
      invSemenAnalysis,
      invDfi,
      fertilityTreatments,
      fertilityCounselingDone,
      paFindings,
      paScars,
      psVulvaVagina,
      psCervixHealthy,
      psCervixEctropion,
      psCervicalSmearDone,
      psBleedingOnTouch,
      pvUterusPosition,
      pvUterusSize,
      pvUterusMobility,
      pvFornicesTenderness,
      threeDScan,
      factorsInFavour,
      factorsNotInFavour,
      recommendedWifeTests,
      recommendedHusbandTests,
      recSemenAnalysis,
      recDfi,
      pendingHusbandTests,
      pendingWifeTests,
      fertilityFoods,
      fertilitySupplements,
      followUpPlan,
      finalDiagnosis,
      gynaeSmearResult,
      gynaeHpv,
      edd,
      gestationalAge,
      conceptionMode,
      currentPregnancyNotes,
    ]
  );

  // Generate the formatted readable narrative text
  const narrativeText = useMemo(() => generateProformaNarrative(currentPayload), [currentPayload]);

  // Synchronize state and narrative to parent OPDWorkbench form
  useEffect(() => {
    if (!onDataChange) return;

    const complaints = reasonForConsultation?.trim()
      ? reasonForConsultation.trim()
      : fertilityType?.trim()
      ? `${fertilityType.trim()} Infertility Consultation`
      : '';

    const presentNarrative = generatePresentHistoryNarrative(currentPayload);
    const pastNarrative = generatePastHistoryNarrative(currentPayload);
    const examNarrative = generateExaminationNarrative(currentPayload);

    onDataChange(currentPayload, {
      complaints,
      history: presentNarrative,
      exam: examNarrative,
      pastHistory: pastNarrative,
    });
  }, [currentPayload, onDataChange, reasonForConsultation, fertilityType]);

  // Save to patient clinical record
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
            : 'Obstetric Antenatal Record',
        data: {
          ...currentPayload,
          narrative: narrativeText,
        },
      };

      if (patient?.id) {
        await patientsApi.createClinicalRecord(patient.id, payload);
      }
      setSaveSuccess(true);
      toast.success(
        'Proforma Saved',
        'Clinical history and narrative saved to patient medical chart.'
      );
      onSaved?.();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Unable to save proforma');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyNarrative = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopiedNarrative(true);
    toast.success('Copied!', 'Clinical narrative copied to clipboard in sentence form.');
    setTimeout(() => setCopiedNarrative(false), 2000);
  };

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Main UI
  const mainContent = (
    <div
      className={`bg-white rounded-xl ${
        inline
          ? 'border-0 shadow-none w-full'
          : 'shadow-2xl border border-slate-200 w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150'
      } print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible`}
    >
      {/* Top Bar: Inline Sub-Tab Strip vs Modal Header */}
      {inline ? (
        /* Inline Mode Sub-Tabs (Clean, seamless with OPD Workbench, no redundant demographic duplication) */
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <ClipboardList className="w-3.5 h-3.5 text-[#2878a8]" />
              <span>{activeTab === 'fertility' ? 'Fertility Template' : activeTab === 'gynaecology' ? 'Gynaecology Template' : 'Obstetric Template'}</span>
            </span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                  viewMode === 'form'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2878a8]" />
                <span>Structured Form</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sentence')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                  viewMode === 'sentence'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View clinical history in clean readable sentence form"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sentence Narrative</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'sentence' && (
              <button
                type="button"
                onClick={handleCopyNarrative}
                className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNarrative ? 'Copied!' : 'Copy Sentence Form'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Modal Dialog Mode Header (Only when opened in dialog popup) */
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/90 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2878a8]/10 border border-[#2878a8]/20 flex items-center justify-center text-[#2878a8]">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>Clinical History Proforma</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2878a8]/10 text-[#2878a8] capitalize">
                  {activeTab} Consultation
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Patient: <strong className="text-slate-800">{femaleName || patient?.name}</strong>{' '}
                ({patient?.vid || 'VID-000'})
                {(maleName || partner?.name) && ` · Partner: ${maleName || partner?.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Proforma Type Switcher: Only displayed in standalone modal mode; in inline workbench mode, top toolbar is the single source */}
            {!inline && (
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('fertility')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'fertility'
                      ? 'bg-[#2878a8] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Fertility</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gynaecology')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'gynaecology'
                      ? 'bg-[#2878a8] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Gynaecology</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('obstetric')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'obstetric'
                      ? 'bg-[#2878a8] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Baby className="w-3.5 h-3.5" />
                  <span>Obstetric</span>
                </button>
              </div>
            )}

            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  viewMode === 'form'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Form Entry</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sentence')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'sentence'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View clinical history in clean readable sentence form"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sentence Form</span>
              </button>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title={inline ? "Switch back to standard free-text notes" : "Close proforma"}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
                aria-label={inline ? "Switch to standard free-text" : "Close"}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Body */}
      <div
        className={`${
          inline ? 'p-4' : 'flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar'
        } print:overflow-visible print:p-0`}
      >
        {/* =========================================================================
            MODE 1: STRUCTURED FORM ENTRY
            ========================================================================= */}
        {viewMode === 'form' && (
          <div className="p-4 sm:p-5 space-y-6 overflow-y-auto max-h-[78vh] custom-scrollbar">
            <ProformaHeaderSection
              inline={inline}
              referredBy={referredBy}
              setReferredBy={setReferredBy}
              livesIn={livesIn}
              setLivesIn={setLivesIn}
              seenByDr={seenByDr}
              setSeenByDr={setSeenByDr}
              staffInAttendance={staffInAttendance}
              setStaffInAttendance={setStaffInAttendance}
              reasonForConsultation={reasonForConsultation}
              setReasonForConsultation={setReasonForConsultation}
            />

            <ProformaCoupleSection
              activeTab={activeTab}
              fertilityType={fertilityType}
              setFertilityType={setFertilityType}
              fertilityFactor={fertilityFactor}
              setFertilityFactor={setFertilityFactor}
              marriedInYear={marriedInYear}
              setMarriedInYear={setMarriedInYear}
              tryingForPregnancy={tryingForPregnancy}
              setTryingForPregnancy={setTryingForPregnancy}
              consanguinity={consanguinity}
              setConsanguinity={setConsanguinity}
            />

            <ProformaFemaleSection
              inline={inline}
              femaleName={femaleName}
              setFemaleName={setFemaleName}
              femaleProfession={femaleProfession}
              setFemaleProfession={setFemaleProfession}
              femaleWeight={femaleWeight}
              setFemaleWeight={setFemaleWeight}
              femaleBmi={femaleBmi}
              setFemaleBmi={setFemaleBmi}
              femalePallor={femalePallor}
              setFemalePallor={setFemalePallor}
              femalePedalEdema={femalePedalEdema}
              setFemalePedalEdema={setFemalePedalEdema}
              femaleGoitre={femaleGoitre}
              setFemaleGoitre={setFemaleGoitre}
              femaleBp={femaleBp}
              setFemaleBp={setFemaleBp}
              periodsEvery={periodsEvery}
              setPeriodsEvery={setPeriodsEvery}
              durationBleeding={durationBleeding}
              setDurationBleeding={setDurationBleeding}
              lmp={lmp}
              setLmp={setLmp}
              periodsPainful={periodsPainful}
              setPeriodsPainful={setPeriodsPainful}
              periodsHeavy={periodsHeavy}
              setPeriodsHeavy={setPeriodsHeavy}
              ageAtMenarche={ageAtMenarche}
              setAgeAtMenarche={setAgeAtMenarche}
              menstrualAdditional={menstrualAdditional}
              setMenstrualAdditional={setMenstrualAdditional}
              gpal={gpal}
              setGpal={setGpal}
              obRows={obRows}
              setObRows={setObRows}
              addObRow={addObRow}
              removeObRow={removeObRow}
              contraceptionHistory={contraceptionHistory}
              setContraceptionHistory={setContraceptionHistory}
              femaleSmoking={femaleSmoking}
              setFemaleSmoking={setFemaleSmoking}
              femaleGutka={femaleGutka}
              setFemaleGutka={setFemaleGutka}
              femaleAlcohol={femaleAlcohol}
              setFemaleAlcohol={setFemaleAlcohol}
              femaleToddy={femaleToddy}
              setFemaleToddy={setFemaleToddy}
              femaleCoffee={femaleCoffee}
              setFemaleCoffee={setFemaleCoffee}
              femaleAdmissions={femaleAdmissions}
              setFemaleAdmissions={setFemaleAdmissions}
              femaleRegularMed={femaleRegularMed}
              setFemaleRegularMed={setFemaleRegularMed}
              femaleTb={femaleTb}
              setFemaleTb={setFemaleTb}
              femaleBleedingDisorders={femaleBleedingDisorders}
              setFemaleBleedingDisorders={setFemaleBleedingDisorders}
              femaleGalactorrhoea={femaleGalactorrhoea}
              setFemaleGalactorrhoea={setFemaleGalactorrhoea}
              femaleAllergies={femaleAllergies}
              setFemaleAllergies={setFemaleAllergies}
              femaleCervicalSmear={femaleCervicalSmear}
              setFemaleCervicalSmear={setFemaleCervicalSmear}
              femalePastSurgical={femalePastSurgical}
              setFemalePastSurgical={setFemalePastSurgical}
              femaleFamilyHistory={femaleFamilyHistory}
              setFemaleFamilyHistory={setFemaleFamilyHistory}
            />

            <ProformaMaleSection
              inline={inline}
              activeTab={activeTab}
              maleName={maleName}
              setMaleName={setMaleName}
              maleProfession={maleProfession}
              setMaleProfession={setMaleProfession}
              maleWeight={maleWeight}
              setMaleWeight={setMaleWeight}
              maleBmi={maleBmi}
              setMaleBmi={setMaleBmi}
              malePallor={malePallor}
              setMalePallor={setMalePallor}
              malePedalEdema={malePedalEdema}
              setMalePedalEdema={setMalePedalEdema}
              maleBp={maleBp}
              setMaleBp={setMaleBp}
              frequencyIntercourse={frequencyIntercourse}
              setFrequencyIntercourse={setFrequencyIntercourse}
              maleLastSi={maleLastSi}
              setMaleLastSi={setMaleLastSi}
              maleErectileIssues={maleErectileIssues}
              setMaleErectileIssues={setMaleErectileIssues}
              maleDyspareunia={maleDyspareunia}
              setMaleDyspareunia={setMaleDyspareunia}
              maleScrotalInjury={maleScrotalInjury}
              setMaleScrotalInjury={setMaleScrotalInjury}
              maleMumps={maleMumps}
              setMaleMumps={setMaleMumps}
              maleSmoking={maleSmoking}
              setMaleSmoking={setMaleSmoking}
              maleGutka={maleGutka}
              setMaleGutka={setMaleGutka}
              maleAlcohol={maleAlcohol}
              setMaleAlcohol={setMaleAlcohol}
              maleToddy={maleToddy}
              setMaleToddy={setMaleToddy}
              maleCoffee={maleCoffee}
              setMaleCoffee={setMaleCoffee}
              maleAdmissions={maleAdmissions}
              setMaleAdmissions={setMaleAdmissions}
              maleRegularMed={maleRegularMed}
              setMaleRegularMed={setMaleRegularMed}
              maleTb={maleTb}
              setMaleTb={setMaleTb}
              maleAllergies={maleAllergies}
              setMaleAllergies={setMaleAllergies}
              malePastSurgical={malePastSurgical}
              setMalePastSurgical={setMalePastSurgical}
              maleFamilyHistory={maleFamilyHistory}
              setMaleFamilyHistory={setMaleFamilyHistory}
            />

            <ProformaInvestigationsSection
              invAmh={invAmh}
              setInvAmh={setInvAmh}
              invFsh={invFsh}
              setInvFsh={setInvFsh}
              invLh={invLh}
              setInvLh={setInvLh}
              invTsh={invTsh}
              setInvTsh={setInvTsh}
              invTubalPatency={invTubalPatency}
              setInvTubalPatency={setInvTubalPatency}
              invHysteroLap={invHysteroLap}
              setInvHysteroLap={setInvHysteroLap}
              invSemenAnalysis={invSemenAnalysis}
              setInvSemenAnalysis={setInvSemenAnalysis}
              invDfi={invDfi}
              setInvDfi={setInvDfi}
              fertilityTreatments={fertilityTreatments}
              setFertilityTreatments={setFertilityTreatments}
              fertilityCounselingDone={fertilityCounselingDone}
              setFertilityCounselingDone={setFertilityCounselingDone}
            />

            <ProformaExamSection
              paFindings={paFindings}
              setPaFindings={setPaFindings}
              paScars={paScars}
              setPaScars={setPaScars}
              psVulvaVagina={psVulvaVagina}
              setPsVulvaVagina={setPsVulvaVagina}
              psCervixHealthy={psCervixHealthy}
              setPsCervixHealthy={setPsCervixHealthy}
              psCervixEctropion={psCervixEctropion}
              setPsCervixEctropion={setPsCervixEctropion}
              psCervicalSmearDone={psCervicalSmearDone}
              setPsCervicalSmearDone={setPsCervicalSmearDone}
              psBleedingOnTouch={psBleedingOnTouch}
              setPsBleedingOnTouch={setPsBleedingOnTouch}
              pvUterusPosition={pvUterusPosition}
              setPvUterusPosition={setPvUterusPosition}
              pvUterusSize={pvUterusSize}
              setPvUterusSize={setPvUterusSize}
              pvUterusMobility={pvUterusMobility}
              setPvUterusMobility={setPvUterusMobility}
              pvFornicesTenderness={pvFornicesTenderness}
              setPvFornicesTenderness={setPvFornicesTenderness}
              threeDScan={threeDScan}
              setThreeDScan={setThreeDScan}
              fertilityCounselingDone={fertilityCounselingDone}
              setFertilityCounselingDone={setFertilityCounselingDone}
              factorsInFavour={factorsInFavour}
              setFactorsInFavour={setFactorsInFavour}
              factorsNotInFavour={factorsNotInFavour}
              setFactorsNotInFavour={setFactorsNotInFavour}
            />

            <ProformaPlanSection
              inline={inline}
              factorsInFavour={factorsInFavour}
              setFactorsInFavour={setFactorsInFavour}
              factorsNotInFavour={factorsNotInFavour}
              setFactorsNotInFavour={setFactorsNotInFavour}
              recommendedWifeTests={recommendedWifeTests}
              setRecommendedWifeTests={setRecommendedWifeTests}
              recommendedHusbandTests={recommendedHusbandTests}
              setRecommendedHusbandTests={setRecommendedHusbandTests}
              recSemenAnalysis={recSemenAnalysis}
              setRecSemenAnalysis={setRecSemenAnalysis}
              recDfi={recDfi}
              setRecDfi={setRecDfi}
              pendingHusbandTests={pendingHusbandTests}
              setPendingHusbandTests={setPendingHusbandTests}
              pendingWifeTests={pendingWifeTests}
              setPendingWifeTests={setPendingWifeTests}
              fertilityFoods={fertilityFoods}
              setFertilityFoods={setFertilityFoods}
              fertilitySupplements={fertilitySupplements}
              setFertilitySupplements={setFertilitySupplements}
              followUpPlan={followUpPlan}
              setFollowUpPlan={setFollowUpPlan}
              finalDiagnosis={finalDiagnosis}
              setFinalDiagnosis={setFinalDiagnosis}
            />

            <ProformaSpecialtySections
              activeTab={activeTab}
              contraceptionHistory={contraceptionHistory}
              setContraceptionHistory={setContraceptionHistory}
              gynaeSmearResult={gynaeSmearResult}
              setGynaeSmearResult={setGynaeSmearResult}
              gynaeHpv={gynaeHpv}
              setGynaeHpv={setGynaeHpv}
              edd={edd}
              setEdd={setEdd}
              gestationalAge={gestationalAge}
              setGestationalAge={setGestationalAge}
              conceptionMode={conceptionMode}
              setConceptionMode={setConceptionMode}
              currentPregnancyNotes={currentPregnancyNotes}
              setCurrentPregnancyNotes={setCurrentPregnancyNotes}
            />
          </div>
        )}

        {/* =========================================================================
            MODE 2: READABLE SENTENCE FORM (THE NARRATIVE TEXT VIEW)
            ========================================================================= */}
        {viewMode === 'sentence' && (
          <ProformaSentenceView
            copiedNarrative={copiedNarrative}
            handleCopyNarrative={handleCopyNarrative}
            setViewMode={setViewMode}
            narrativeText={narrativeText}
          />
        )}

        {/* =========================================================================
            MODE 3: PRINT SHEET PREVIEW (EXHAUSTIVE PROFORMA SHEET)
            ========================================================================= */}
        {viewMode === 'preview' && (
          <ProformaPrintView
            patient={patient}
            partner={partner}
            activeTab={activeTab}
            usePrePrintedPad={usePrePrintedPad}
            setUsePrePrintedPad={setUsePrePrintedPad}
            data={{
              femaleName,
              maleName,
              referredBy,
              livesIn,
              seenByDr,
              staffInAttendance,
              reasonForConsultation,
              fertilityType,
              fertilityFactor,
              marriedInYear,
              tryingForPregnancy,
              consanguinity,
              femaleProfession,
              femaleWeight,
              femaleBmi,
              femalePallor,
              femalePedalEdema,
              femaleGoitre,
              femaleBp,
              periodsEvery,
              durationBleeding,
              lmp,
              periodsPainful,
              periodsHeavy,
              ageAtMenarche,
              menstrualAdditional,
              femaleSmoking,
              femaleGutka,
              femaleAlcohol,
              femaleToddy,
              femaleCoffee,
              femaleAdmissions,
              femaleRegularMed,
              femaleTb,
              femaleBleedingDisorders,
              femaleGalactorrhoea,
              femaleAllergies,
              femaleCervicalSmear,
              femalePastSurgical,
              femaleFamilyHistory,
              gpal,
              obRows,
              maleProfession,
              maleWeight,
              maleBmi,
              malePallor,
              malePedalEdema,
              maleBp,
              frequencyIntercourse,
              maleLastSi,
              maleErectileIssues,
              maleDyspareunia,
              maleScrotalInjury,
              maleMumps,
              maleSmoking,
              maleGutka,
              maleAlcohol,
              maleToddy,
              maleCoffee,
              maleAdmissions,
              maleRegularMed,
              maleTb,
              maleAllergies,
              malePastSurgical,
              paFindings,
              paScars,
              psVulvaVagina,
              psCervixHealthy,
              psCervixEctropion,
              psCervicalSmearDone,
              psBleedingOnTouch,
              pvUterusPosition,
              pvUterusSize,
              pvUterusMobility,
              pvFornicesTenderness,
              threeDScan,
              factorsInFavour,
              factorsNotInFavour,
              recommendedWifeTests,
              recommendedHusbandTests,
              recSemenAnalysis,
              recDfi,
              pendingHusbandTests,
              pendingWifeTests,
              fertilityFoods,
              fertilitySupplements,
              followUpPlan,
              finalDiagnosis,
            }}
          />
        )}
      </div>

      {/* Bottom Footer Bar (Only in Dialog Popup Mode) */}
      {!inline && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Proforma and sentence narrative saved to patient record!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'sentence' && (
              <button
                type="button"
                onClick={handleCopyNarrative}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Sentence Form</span>
              </button>
            )}

            {viewMode === 'preview' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-[#2878a8] hover:bg-[#20638c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Proforma'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return mainContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-white print:overflow-visible">
      {mainContent}
    </div>
  );
}
