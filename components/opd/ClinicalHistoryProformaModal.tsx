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
} from 'lucide-react';
import { patientsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

import {
  generateProformaNarrative,
  ProformaSentenceView,
  ProformaPrintView,
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
    initialData?.reasonForConsultation || 'Primary infertility evaluation, seeking fertility consultation.'
  );

  // 2. Couple Fertility Profile
  const [fertilityType, setFertilityType] = useState(initialData?.fertilityType || 'Primary');
  const [fertilityFactor, setFertilityFactor] = useState(initialData?.fertilityFactor || 'Couple');
  const [marriedInYear, setMarriedInYear] = useState(initialData?.marriedInYear || '');
  const [tryingForPregnancy, setTryingForPregnancy] = useState(initialData?.tryingForPregnancy || '');
  const [consanguinity, setConsanguinity] = useState(
    initialData?.consanguinity || 'Non-Consanguineous'
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
  const [periodsEvery, setPeriodsEvery] = useState(initialData?.periodsEvery || '28-30');
  const [durationBleeding, setDurationBleeding] = useState(initialData?.durationBleeding || '4-5');
  const [periodsPainful, setPeriodsPainful] = useState(initialData?.periodsPainful || 'No');
  const [periodsHeavy, setPeriodsHeavy] = useState(initialData?.periodsHeavy || 'No');
  const [ageAtMenarche, setAgeAtMenarche] = useState(initialData?.ageAtMenarche || '13');
  const [lmp, setLmp] = useState(initialData?.lmp || new Date().toISOString().split('T')[0]);
  const [menstrualAdditional, setMenstrualAdditional] = useState(
    initialData?.menstrualAdditional || ''
  );

  // Obstetric History
  const [gpal, setGpal] = useState(initialData?.gpal || 'G0 P0 L0 A0');
  const [obRows, setObRows] = useState<ObstetricRow[]>(
    initialData?.obRows || [
      { year: '', place: '', details: '', outcome: '', gestation: '', mode: '', babySexWeight: '' },
    ]
  );

  // Contraception History
  const [contraceptionHistory, setContraceptionHistory] = useState(
    initialData?.contraceptionHistory || 'None'
  );

  // Female Habits
  const [femaleSmoking, setFemaleSmoking] = useState(initialData?.femaleSmoking || 'No');
  const [femaleGutka, setFemaleGutka] = useState(initialData?.femaleGutka || 'No');
  const [femaleAlcohol, setFemaleAlcohol] = useState(initialData?.femaleAlcohol || 'No');
  const [femaleToddy, setFemaleToddy] = useState(initialData?.femaleToddy || 'No');
  const [femaleCoffee, setFemaleCoffee] = useState(initialData?.femaleCoffee || '1 cup/day');

  // Female Past Medical History
  const [femaleAdmissions, setFemaleAdmissions] = useState(initialData?.femaleAdmissions || 'Nil');
  const [femaleRegularMed, setFemaleRegularMed] = useState(initialData?.femaleRegularMed || 'None');
  const [femaleTb, setFemaleTb] = useState(initialData?.femaleTb || 'No');
  const [femaleBleedingDisorders, setFemaleBleedingDisorders] = useState(
    initialData?.femaleBleedingDisorders || 'No'
  );
  const [femaleGalactorrhoea, setFemaleGalactorrhoea] = useState(
    initialData?.femaleGalactorrhoea || 'No'
  );
  const [femaleAllergies, setFemaleAllergies] = useState(
    initialData?.femaleAllergies || 'No known drug allergies (NKDA)'
  );
  const [femaleCervicalSmear, setFemaleCervicalSmear] = useState(
    initialData?.femaleCervicalSmear || 'Not done'
  );

  // Female Past Surgical History
  const [femalePastSurgical, setFemalePastSurgical] = useState(
    initialData?.femalePastSurgical || 'Nil'
  );

  // Female Family History
  const [femaleFamilyHistory, setFemaleFamilyHistory] = useState<string[]>(
    initialData?.femaleFamilyHistory || ['No family history of DM/HTN/Cancers']
  );

  // Female Examination
  const [femalePallor, setFemalePallor] = useState(initialData?.femalePallor || 'No');
  const [femalePedalEdema, setFemalePedalEdema] = useState(initialData?.femalePedalEdema || 'No');
  const [femaleGoitre, setFemaleGoitre] = useState(initialData?.femaleGoitre || 'No');
  const [femaleBp, setFemaleBp] = useState(initialData?.femaleBp || '120/80');

  // 4. Male Partner Details
  const [maleName, setMaleName] = useState(
    initialData?.maleName || partner?.name || patient?.partner_name || ''
  );
  const [maleProfession, setMaleProfession] = useState(initialData?.maleProfession || '');
  const [maleWeight, setMaleWeight] = useState(initialData?.maleWeight || '');
  const [maleBmi, setMaleBmi] = useState(initialData?.maleBmi || '');
  const [maleErectileIssues, setMaleErectileIssues] = useState(
    initialData?.maleErectileIssues || 'No'
  );
  const [frequencyIntercourse, setFrequencyIntercourse] = useState(
    initialData?.frequencyIntercourse || '2-3 times/week'
  );
  const [maleDyspareunia, setMaleDyspareunia] = useState(initialData?.maleDyspareunia || 'No');
  const [maleLastSi, setMaleLastSi] = useState(initialData?.maleLastSi || '3 days ago');
  const [maleScrotalInjury, setMaleScrotalInjury] = useState(initialData?.maleScrotalInjury || 'No');
  const [maleMumps, setMaleMumps] = useState(initialData?.maleMumps || 'No');

  // Male Habits
  const [maleSmoking, setMaleSmoking] = useState(initialData?.maleSmoking || 'No');
  const [maleGutka, setMaleGutka] = useState(initialData?.maleGutka || 'No');
  const [maleAlcohol, setMaleAlcohol] = useState(initialData?.maleAlcohol || 'No');
  const [maleToddy, setMaleToddy] = useState(initialData?.maleToddy || 'No');
  const [maleCoffee, setMaleCoffee] = useState(initialData?.maleCoffee || '1 cup/day');

  // Male Past Medical History
  const [maleAdmissions, setMaleAdmissions] = useState(initialData?.maleAdmissions || 'Nil');
  const [maleRegularMed, setMaleRegularMed] = useState(initialData?.maleRegularMed || 'None');
  const [maleTb, setMaleTb] = useState(initialData?.maleTb || 'No');
  const [maleAllergies, setMaleAllergies] = useState(initialData?.maleAllergies || 'None');

  // Male Past Surgical History
  const [malePastSurgical, setMalePastSurgical] = useState(initialData?.malePastSurgical || 'Nil');

  // Male Family History
  const [maleFamilyHistory, setMaleFamilyHistory] = useState<string[]>(
    initialData?.maleFamilyHistory || ['No family history of DM/HTN/Cancers']
  );

  // Male Examination
  const [malePallor, setMalePallor] = useState(initialData?.malePallor || 'No');
  const [malePedalEdema, setMalePedalEdema] = useState(initialData?.malePedalEdema || 'No');
  const [maleGoitre, setMaleGoitre] = useState(initialData?.maleGoitre || 'No');
  const [maleBp, setMaleBp] = useState(initialData?.maleBp || '120/80');

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
    initialData?.fertilityTreatments || 'Nil prior fertility treatments'
  );

  // 7. Consultation Notes & Examination
  const [fertilityCounselingDone, setFertilityCounselingDone] = useState(
    initialData?.fertilityCounselingDone ?? true
  );
  const [paFindings, setPaFindings] = useState(initialData?.paFindings || 'Soft');
  const [paScars, setPaScars] = useState(initialData?.paScars || 'None');
  const [psVulvaVagina, setPsVulvaVagina] = useState(initialData?.psVulvaVagina || 'Healthy');
  const [psCervixHealthy, setPsCervixHealthy] = useState(initialData?.psCervixHealthy ?? true);
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
    initialData?.pvUterusPosition || 'Anteverted'
  );
  const [pvUterusSize, setPvUterusSize] = useState(initialData?.pvUterusSize || 'Normal');
  const [pvUterusMobility, setPvUterusMobility] = useState(
    initialData?.pvUterusMobility || 'Mobile'
  );
  const [pvFornicesTenderness, setPvFornicesTenderness] = useState(
    initialData?.pvFornicesTenderness || 'Absent'
  );

  const [threeDScan, setThreeDScan] = useState(
    initialData?.threeDScan ||
      'Normal anteverted uterus, regular endo-myometrial junction. Bilateral ovaries normal with good follicle count. No adnexal masses.'
  );
  const [factorsInFavour, setFactorsInFavour] = useState(
    initialData?.factorsInFavour || 'Normal ovulatory cycles, bilateral tubal patency suspected, young age.'
  );
  const [factorsNotInFavour, setFactorsNotInFavour] = useState(
    initialData?.factorsNotInFavour || 'Duration of trying, borderline semen parameters.'
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
    initialData?.recommendedWifeTests || defaultWifeTests
  );
  const [recommendedHusbandTests, setRecommendedHusbandTests] = useState<string[]>(
    initialData?.recommendedHusbandTests || defaultHusbandTests
  );
  const [recSemenAnalysis, setRecSemenAnalysis] = useState(
    initialData?.recSemenAnalysis ?? true
  );
  const [recDfi, setRecDfi] = useState(initialData?.recDfi ?? true);
  const [pendingHusbandTests, setPendingHusbandTests] = useState<string[]>(
    initialData?.pendingHusbandTests || defaultPendingHusband
  );
  const [pendingWifeTests, setPendingWifeTests] = useState<string[]>(
    initialData?.pendingWifeTests || defaultPendingWife
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
    initialData?.fertilityFoods || defaultFoods
  );
  const [fertilitySupplements, setFertilitySupplements] = useState(
    initialData?.fertilitySupplements || 'Antioxidants, CoQ10, Folic Acid, Vitamin D3'
  );
  const [followUpPlan, setFollowUpPlan] = useState(
    initialData?.followUpPlan || 'See with reports for and 3D scan + Smear/Speculum'
  );
  const [finalDiagnosis, setFinalDiagnosis] = useState(
    initialData?.finalDiagnosis || 'Primary Infertility - Evaluation & Diagnostic Workup'
  );

  // Gynaecology Specific
  const [gynaeSmearResult, setGynaeSmearResult] = useState(initialData?.gynaeSmearResult || '');
  const [gynaeHpv, setGynaeHpv] = useState(initialData?.gynaeHpv || '');

  // Obstetric Specific
  const [edd, setEdd] = useState(initialData?.edd || '');
  const [gestationalAge, setGestationalAge] = useState(initialData?.gestationalAge || '');
  const [conceptionMode, setConceptionMode] = useState(
    initialData?.conceptionMode || 'Spontaneous'
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

    const complaints = reasonForConsultation || `${fertilityType} Infertility Consultation`;
    const examSummary = `O/E: ${
      femalePallor === 'No' ? 'No pallor' : 'Pallor'
    }, ${femalePedalEdema === 'No' ? 'No pedal edema' : 'Pedal edema'}, ${
      femaleGoitre === 'No' ? 'No goitre' : 'Goitre'
    }, BP ${femaleBp} mmHg | P/A: ${paFindings} | P/S: ${psVulvaVagina}, Cervix: ${
      psCervixHealthy ? 'Healthy' : 'Abnormal'
    } | P/V: ${pvUterusPosition} ${pvUterusSize}, ${pvUterusMobility}`;

    const pastSummary = `Medical: ${femaleAdmissions} | Regular Meds: ${femaleRegularMed} | TB: ${femaleTb} | Allergies: ${femaleAllergies} | Surgeries: ${femalePastSurgical}`;

    onDataChange(currentPayload, {
      complaints,
      history: narrativeText,
      exam: examSummary,
      pastHistory: pastSummary,
    });
  }, [currentPayload, narrativeText, onDataChange, reasonForConsultation, fertilityType, femalePallor, femalePedalEdema, femaleGoitre, femaleBp, paFindings, psVulvaVagina, psCervixHealthy, pvUterusPosition, pvUterusSize, pvUterusMobility, femaleAdmissions, femaleRegularMed, femaleTb, femaleAllergies, femalePastSurgical]);

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
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                  viewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Sheet</span>
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
            {viewMode === 'preview' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
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
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  viewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
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
          <div className="space-y-6 text-xs text-slate-800">
            {/* Action Banner for Sentence Sync */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-lg p-3 flex items-center justify-between gap-3 text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-medium">
                  <strong>Live Sentence Generator Active:</strong> Every option you fill is
                  instantly converted into a readable narrative and synced directly into Present
                  History.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('sentence')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Readable Sentence Form</span>
              </button>
            </div>

            {/* Section 1: Referral & Header */}
            {!inline ? (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] flex items-center gap-2">
                  <span>1. Referral &amp; Consultation Details</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Referred by
                    </label>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Doctor / Clinic name"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Lives in</label>
                    <input
                      type="text"
                      value={livesIn}
                      onChange={(e) => setLivesIn(e.target.value)}
                      placeholder="City / Region"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Seen by Dr
                    </label>
                    <input
                      type="text"
                      value={seenByDr}
                      onChange={(e) => setSeenByDr(e.target.value)}
                      placeholder="Consultant Doctor"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Staff in attendance
                    </label>
                    <input
                      type="text"
                      value={staffInAttendance}
                      onChange={(e) => setStaffInAttendance(e.target.value)}
                      placeholder="Nurse / Assistant"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reason for consultation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={reasonForConsultation}
                      onChange={(e) => setReasonForConsultation(e.target.value)}
                      placeholder="Primary reason for visit..."
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Reason for Consultation / Presenting Complaint <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reasonForConsultation}
                  onChange={(e) => setReasonForConsultation(e.target.value)}
                  placeholder="Primary reason for visit (e.g. Primary infertility for 3 years, irregular cycles)..."
                  className="vmd-input text-xs w-full"
                />
              </div>
            )}

            {/* Section 2: Couple Fertility Infertility Status */}
            {activeTab === 'fertility' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  2. Couple Infertility Profile
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Primary / Secondary
                    </label>
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
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Male / Female / Couple
                    </label>
                    <select
                      value={fertilityFactor}
                      onChange={(e) => setFertilityFactor(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="Couple">Couple Factor</option>
                      <option value="Female">Female Factor</option>
                      <option value="Male">Male Factor</option>
                      <option value="Unexplained">Unexplained</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Married in year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={marriedInYear}
                      onChange={(e) => setMarriedInYear(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Trying for pregnancy (yrs)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3 years"
                      value={tryingForPregnancy}
                      onChange={(e) => setTryingForPregnancy(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Consanguinity
                    </label>
                    <select
                      value={consanguinity}
                      onChange={(e) => setConsanguinity(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="Non-Consanguineous">Non-Consanguineous</option>
                      <option value="Consanguineous (1st Degree)">Consanguineous (1st Degree)</option>
                      <option value="Consanguineous (2nd Degree)">Consanguineous (2nd Degree)</option>
                      <option value="Consanguineous">Consanguineous</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Female Partner Assessment */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                {inline ? 'Female Clinical Assessment' : '3. Female Partner Assessment'}
              </h3>
              {!inline && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Female Name
                    </label>
                    <input
                      type="text"
                      value={femaleName}
                      onChange={(e) => setFemaleName(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={femaleProfession}
                      onChange={(e) => setFemaleProfession(e.target.value)}
                      placeholder="e.g. Teacher, Engineer"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={femaleWeight}
                      onChange={(e) => setFemaleWeight(e.target.value)}
                      placeholder="kg"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">BMI</label>
                    <input
                      type="text"
                      value={femaleBmi}
                      onChange={(e) => setFemaleBmi(e.target.value)}
                      placeholder="e.g. 23.4"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Menstrual History */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  MENSTRUAL HISTORY
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods every (days)
                    </label>
                    <input
                      type="text"
                      value={periodsEvery}
                      onChange={(e) => setPeriodsEvery(e.target.value)}
                      placeholder="28-30"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Duration bleeding (days)
                    </label>
                    <input
                      type="text"
                      value={durationBleeding}
                      onChange={(e) => setDurationBleeding(e.target.value)}
                      placeholder="4-5"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods painful?
                    </label>
                    <select
                      value={periodsPainful}
                      onChange={(e) => setPeriodsPainful(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Dysmenorrhea)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods heavy?
                    </label>
                    <select
                      value={periodsHeavy}
                      onChange={(e) => setPeriodsHeavy(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Menorrhagia)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Age at menarche
                    </label>
                    <input
                      type="text"
                      value={ageAtMenarche}
                      onChange={(e) => setAgeAtMenarche(e.target.value)}
                      placeholder="13"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">LMP</label>
                    <input
                      type="date"
                      value={lmp}
                      onChange={(e) => setLmp(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Obstetric & Contraception */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      OBSTETRIC HISTORY
                    </span>
                    <input
                      type="text"
                      value={gpal}
                      onChange={(e) => setGpal(e.target.value)}
                      placeholder="G0 P0 L0 A0"
                      className="vmd-input text-xs w-36 h-7"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 text-[10px] border-b border-slate-200">
                          <th className="p-1 text-left">Year</th>
                          <th className="p-1 text-left">Place</th>
                          <th className="p-1 text-left">Outcome</th>
                          <th className="p-1 w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {obRows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Year"
                                value={r.year}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].year = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Place"
                                value={r.place}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].place = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Full Term / Miscarriage"
                                value={r.outcome}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].outcome = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeObRow(i)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addObRow}
                    className="text-[10px] text-[#2878a8] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Pregnancy Row
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    CONTRACEPTION HISTORY
                  </span>
                  <input
                    type="text"
                    value={contraceptionHistory}
                    onChange={(e) => setContraceptionHistory(e.target.value)}
                    placeholder="e.g. None / Barrier method / OCPs used 1 yr ago"
                    className="vmd-input text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['None', 'Barrier / Condom', 'Oral Contraceptives', 'IUD / Cu-T', 'Natural'].map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setContraceptionHistory(opt)}
                          className="px-2 py-0.5 rounded bg-slate-100 text-[10px] hover:bg-slate-200 text-slate-700"
                        >
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Female Habits: Smoking, Gutka, Alcohol, Toddy, Coffee */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  FEMALE HABITS / LIFESTYLE
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Smoking</label>
                    <select
                      value={femaleSmoking}
                      onChange={(e) => setFemaleSmoking(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="Ex-smoker">Ex-smoker</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Gutka</label>
                    <select
                      value={femaleGutka}
                      onChange={(e) => setFemaleGutka(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Alcohol</label>
                    <select
                      value={femaleAlcohol}
                      onChange={(e) => setFemaleAlcohol(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Social">Social</option>
                      <option value="Regular">Regular</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Toddy</label>
                    <select
                      value={femaleToddy}
                      onChange={(e) => setFemaleToddy(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Coffee</label>
                    <select
                      value={femaleCoffee}
                      onChange={(e) => setFemaleCoffee(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="None">None</option>
                      <option value="1 cup/day">1 cup/day</option>
                      <option value="2 cups/day">2 cups/day</option>
                      <option value=">2 cups/day">&gt; 2 cups/day</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Female Past Medical History */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  PAST MEDICAL HISTORY (FEMALE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Hospital admissions (Non-surgical)
                    </label>
                    <input
                      type="text"
                      value={femaleAdmissions}
                      onChange={(e) => setFemaleAdmissions(e.target.value)}
                      placeholder="Nil"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Regular medication
                    </label>
                    <input
                      type="text"
                      value={femaleRegularMed}
                      onChange={(e) => setFemaleRegularMed(e.target.value)}
                      placeholder="None / Thyroxine 25mcg"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">History of TB</label>
                    <select
                      value={femaleTb}
                      onChange={(e) => setFemaleTb(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      H/O bleeding or clotting disorders
                    </label>
                    <select
                      value={femaleBleedingDisorders}
                      onChange={(e) => setFemaleBleedingDisorders(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      H/O Galactorrhoea
                    </label>
                    <select
                      value={femaleGalactorrhoea}
                      onChange={(e) => setFemaleGalactorrhoea(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Allergies</label>
                    <input
                      type="text"
                      value={femaleAllergies}
                      onChange={(e) => setFemaleAllergies(e.target.value)}
                      placeholder="No known drug allergies (NKDA)"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Cervical smears
                    </label>
                    <input
                      type="text"
                      value={femaleCervicalSmear}
                      onChange={(e) => setFemaleCervicalSmear(e.target.value)}
                      placeholder="Not done / Normal Pap smear 1 year ago"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      PAST SURGICAL HISTORY
                    </label>
                    <input
                      type="text"
                      value={femalePastSurgical}
                      onChange={(e) => setFemalePastSurgical(e.target.value)}
                      placeholder="Nil / Laparoscopy / Appendectomy"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      FAMILY HISTORY OF DM, HTN, CANCERS
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['DM', 'HTN', 'Cancers', 'Thyroid', 'None'].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(
                              femaleFamilyHistory,
                              setFemaleFamilyHistory,
                              cond
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            femaleFamilyHistory.includes(cond)
                              ? 'bg-[#2878a8] text-white border-[#2878a8]'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Female Physical Examination: Pallor, Pedal edema, Goitre, BP */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  EXAMINATION (FEMALE)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">O/E Pallor</label>
                    <select
                      value={femalePallor}
                      onChange={(e) => setFemalePallor(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No pallor</option>
                      <option value="Present">Pallor present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Pedal Edema</label>
                    <select
                      value={femalePedalEdema}
                      onChange={(e) => setFemalePedalEdema(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No pedal edema</option>
                      <option value="Present">Pedal edema present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Goitre</label>
                    <select
                      value={femaleGoitre}
                      onChange={(e) => setFemaleGoitre(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="No">No goitre</option>
                      <option value="Present">Goitre present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">BP (mm Hg)</label>
                    <input
                      type="text"
                      value={femaleBp}
                      onChange={(e) => setFemaleBp(e.target.value)}
                      placeholder="120/80"
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Male Partner Assessment (Fertility Tab) */}
            {activeTab === 'fertility' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  {inline ? 'Male Clinical Assessment' : '4. Male Partner Assessment'}
                </h3>
                {!inline && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Male Name
                      </label>
                      <input
                        type="text"
                        value={maleName}
                        onChange={(e) => setMaleName(e.target.value)}
                        className="vmd-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={maleProfession}
                        onChange={(e) => setMaleProfession(e.target.value)}
                        placeholder="Profession"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={maleWeight}
                        onChange={(e) => setMaleWeight(e.target.value)}
                        placeholder="kg"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">BMI</label>
                      <input
                        type="text"
                        value={maleBmi}
                        onChange={(e) => setMaleBmi(e.target.value)}
                        placeholder="BMI"
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Male Sexual History */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    REPRODUCTIVE &amp; SEXUAL HISTORY
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Problems with erection / ejaculation?
                      </label>
                      <select
                        value={maleErectileIssues}
                        onChange={(e) => setMaleErectileIssues(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Erection Issues">Erection Issues</option>
                        <option value="Premature Ejaculation">Premature Ejaculation</option>
                        <option value="Delayed Ejaculation">Delayed Ejaculation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Frequency of intercourse / week
                      </label>
                      <input
                        type="text"
                        value={frequencyIntercourse}
                        onChange={(e) => setFrequencyIntercourse(e.target.value)}
                        placeholder="2-3 times"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Pain during sexual intercourse?
                      </label>
                      <select
                        value={maleDyspareunia}
                        onChange={(e) => setMaleDyspareunia(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Last SI</label>
                      <input
                        type="text"
                        value={maleLastSi}
                        onChange={(e) => setMaleLastSi(e.target.value)}
                        placeholder="e.g. 2 days ago"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Injuries in groin / scrotum
                      </label>
                      <select
                        value={maleScrotalInjury}
                        onChange={(e) => setMaleScrotalInjury(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Mumps in past / child
                      </label>
                      <select
                        value={maleMumps}
                        onChange={(e) => setMaleMumps(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Male Habits */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    MALE HABITS / LIFESTYLE
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Smoking</label>
                      <select
                        value={maleSmoking}
                        onChange={(e) => setMaleSmoking(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Gutka</label>
                      <select
                        value={maleGutka}
                        onChange={(e) => setMaleGutka(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Alcohol</label>
                      <select
                        value={maleAlcohol}
                        onChange={(e) => setMaleAlcohol(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Social">Social</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Toddy</label>
                      <select
                        value={maleToddy}
                        onChange={(e) => setMaleToddy(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Coffee</label>
                      <select
                        value={maleCoffee}
                        onChange={(e) => setMaleCoffee(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="None">None</option>
                        <option value="1 cup/day">1 cup/day</option>
                        <option value="2 cups/day">2 cups/day</option>
                        <option value=">2 cups/day">&gt; 2 cups/day</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Male Medical & Examination */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    PAST MEDICAL, SURGICAL &amp; EXAMINATION (MALE)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Hospital admissions
                      </label>
                      <input
                        type="text"
                        value={maleAdmissions}
                        onChange={(e) => setMaleAdmissions(e.target.value)}
                        placeholder="Nil"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Regular medication
                      </label>
                      <input
                        type="text"
                        value={maleRegularMed}
                        onChange={(e) => setMaleRegularMed(e.target.value)}
                        placeholder="None"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        History of TB
                      </label>
                      <select
                        value={maleTb}
                        onChange={(e) => setMaleTb(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Allergies</label>
                      <input
                        type="text"
                        value={maleAllergies}
                        onChange={(e) => setMaleAllergies(e.target.value)}
                        placeholder="NKDA"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Past Surgical History
                      </label>
                      <input
                        type="text"
                        value={malePastSurgical}
                        onChange={(e) => setMalePastSurgical(e.target.value)}
                        placeholder="Nil"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">O/E Pallor</label>
                      <select
                        value={malePallor}
                        onChange={(e) => setMalePallor(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No pallor</option>
                        <option value="Present">Pallor present</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        No pedal edema
                      </label>
                      <select
                        value={malePedalEdema}
                        onChange={(e) => setMalePedalEdema(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="No">No pedal edema</option>
                        <option value="Present">Pedal edema</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">BP (mm Hg)</label>
                      <input
                        type="text"
                        value={maleBp}
                        onChange={(e) => setMaleBp(e.target.value)}
                        placeholder="120/80"
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Fertility Investigations & Past Treatments */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                5. Fertility Investigations &amp; Treatments
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Serum AMH (ng/mL)
                  </label>
                  <input
                    type="text"
                    value={invAmh}
                    onChange={(e) => setInvAmh(e.target.value)}
                    placeholder="e.g. 2.8 ng/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">FSH</label>
                  <input
                    type="text"
                    value={invFsh}
                    onChange={(e) => setInvFsh(e.target.value)}
                    placeholder="e.g. 6.4 mIU/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">LH</label>
                  <input
                    type="text"
                    value={invLh}
                    onChange={(e) => setInvLh(e.target.value)}
                    placeholder="e.g. 5.1 mIU/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">TSH</label>
                  <input
                    type="text"
                    value={invTsh}
                    onChange={(e) => setInvTsh(e.target.value)}
                    placeholder="e.g. 1.8 mIU/L"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Tubal patency (HSG/HyCoSy)
                  </label>
                  <input
                    type="text"
                    value={invTubalPatency}
                    onChange={(e) => setInvTubalPatency(e.target.value)}
                    placeholder="Bilateral tubes patent"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Hysteroscopy / Laparoscopy
                  </label>
                  <input
                    type="text"
                    value={invHysteroLap}
                    onChange={(e) => setInvHysteroLap(e.target.value)}
                    placeholder="Not done / Normal cavity"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Semen analysis
                  </label>
                  <input
                    type="text"
                    value={invSemenAnalysis}
                    onChange={(e) => setInvSemenAnalysis(e.target.value)}
                    placeholder="Normozoospermia"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Sperm DFI (%)
                  </label>
                  <input
                    type="text"
                    value={invDfi}
                    onChange={(e) => setInvDfi(e.target.value)}
                    placeholder="e.g. 14%"
                    className="vmd-input text-xs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    FERTILITY TREATMENTS (PAST)
                  </label>
                  <textarea
                    rows={2}
                    value={fertilityTreatments}
                    onChange={(e) => setFertilityTreatments(e.target.value)}
                    placeholder="e.g. Ovulation Induction 3 cycles elsewhere, no IUI/IVF yet..."
                    className="vmd-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Consultation Notes & Physical Examination (P/A, P/S, P/V, 3D Scan) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                6. Consultation Notes &amp; Clinical Pelvic Examination
              </h3>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={fertilityCounselingDone}
                    onChange={(e) => setFertilityCounselingDone(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2878a8] border-slate-300 focus:ring-[#2878a8]"
                  />
                  <span>
                    Fertility explained including hormones, ovulation, tubal patency and semen
                  </span>
                </label>
              </div>

              {/* P/A, P/S, P/V */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* P/A */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/A (PER ABDOMEN)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Soft / Findings</label>
                    <input
                      type="text"
                      value={paFindings}
                      onChange={(e) => setPaFindings(e.target.value)}
                      placeholder="Soft, non-tender"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Scars</label>
                    <input
                      type="text"
                      value={paScars}
                      onChange={(e) => setPaScars(e.target.value)}
                      placeholder="None / LSCS scar"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                {/* P/S */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/S (PER SPECULUM)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Vulva / Vagina
                    </label>
                    <input
                      type="text"
                      value={psVulvaVagina}
                      onChange={(e) => setPsVulvaVagina(e.target.value)}
                      placeholder="Healthy"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psCervixHealthy}
                        onChange={(e) => setPsCervixHealthy(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervix appears healthy</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psCervixEctropion}
                        onChange={(e) => setPsCervixEctropion(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervix ectropion noted</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psCervicalSmearDone}
                        onChange={(e) => setPsCervicalSmearDone(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervical smear done (LBC)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psBleedingOnTouch}
                        onChange={(e) => setPsBleedingOnTouch(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>
                        {psBleedingOnTouch ? 'Bleeding on touch noted' : 'No bleeding noted on touch'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* P/V */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/V (PER VAGINUM)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Uterus Position</label>
                    <select
                      value={pvUterusPosition}
                      onChange={(e) => setPvUterusPosition(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="Anteverted">Anteverted</option>
                      <option value="Retroverted">Retroverted</option>
                      <option value="Midposition">Midposition</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Size</label>
                      <input
                        type="text"
                        value={pvUterusSize}
                        onChange={(e) => setPvUterusSize(e.target.value)}
                        placeholder="Normal"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Mobility</label>
                      <select
                        value={pvUterusMobility}
                        onChange={(e) => setPvUterusMobility(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="Mobile">Mobile</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Fornices: Tenderness
                    </label>
                    <input
                      type="text"
                      value={pvFornicesTenderness}
                      onChange={(e) => setPvFornicesTenderness(e.target.value)}
                      placeholder="Absent / Tenderness noted"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3D Scan & Factors */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    3-D Scan Findings
                  </label>
                  <textarea
                    rows={2}
                    value={threeDScan}
                    onChange={(e) => setThreeDScan(e.target.value)}
                    placeholder="Uterus architecture, cavity, endometrial thickness, antral follicle count..."
                    className="vmd-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Factors in favour
                    </label>
                    <textarea
                      rows={2}
                      value={factorsInFavour}
                      onChange={(e) => setFactorsInFavour(e.target.value)}
                      placeholder="e.g. Good ovarian reserve, patent tubes, age..."
                      className="vmd-input text-xs border-emerald-200 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      Factors not in favour
                    </label>
                    <textarea
                      rows={2}
                      value={factorsNotInFavour}
                      onChange={(e) => setFactorsNotInFavour(e.target.value)}
                      placeholder="e.g. Duration of infertility, elevated DFI, elevated BMI..."
                      className="vmd-input text-xs border-rose-200 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7: Recommended Basic Investigations Checklists */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                7. Recommended Basic Investigations Checklist
              </h3>

              {/* Wife & Husband Checklists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Wife - Recommended Tests
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {defaultWifeTests.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(
                            recommendedWifeTests,
                            setRecommendedWifeTests,
                            test
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          recommendedWifeTests.includes(test)
                            ? 'bg-[#2878a8] text-white border-[#2878a8]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {recommendedWifeTests.includes(test) ? '✓ ' : '+ '}
                        {test}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Husband - Recommended Tests
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {defaultHusbandTests.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(
                            recommendedHusbandTests,
                            setRecommendedHusbandTests,
                            test
                          )
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          recommendedHusbandTests.includes(test)
                            ? 'bg-[#2878a8] text-white border-[#2878a8]'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {recommendedHusbandTests.includes(test) ? '✓ ' : '+ '}
                        {test}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Semen & DFI Timings instructions */}
              <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-md">
                <label className="flex items-start gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recSemenAnalysis}
                    onChange={(e) => setRecSemenAnalysis(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 border-amber-300 mt-0.5"
                  />
                  <span>
                    Semen analysis (Attend with 3 to 7 days abstinence, BY APPOINTMENT ONLY) Between
                    9 AM TO 11 AM
                  </span>
                </label>
                <label className="flex items-start gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recDfi}
                    onChange={(e) => setRecDfi(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 border-amber-300 mt-0.5"
                  />
                  <span>
                    Sperm DNA Fragmentation DFI (Attend with 2 days abstinence, BY APPOINTMENT ONLY)
                    Between 9 AM TO 11 AM
                  </span>
                </label>
              </div>

              {/* Pending Pre-op / Serology Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Pending - Husband Panel
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {defaultPendingHusband.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(
                            pendingHusbandTests,
                            setPendingHusbandTests,
                            p
                          )
                        }
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                          pendingHusbandTests.includes(p)
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Pending - Wife Panel
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {defaultPendingWife.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          toggleArrayItem(pendingWifeTests, setPendingWifeTests, p)
                        }
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                          pendingWifeTests.includes(p)
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8: Advised Fertility Foods, Supplements & Follow-up */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                8. Advised Regimen, Foods &amp; Review Plan
              </h3>

              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Fertility Foods
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defaultFoods.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleArrayItem(fertilityFoods, setFertilityFoods, f)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        fertilityFoods.includes(f)
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {fertilityFoods.includes(f) ? '✓ ' : '+ '}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Fertility Supplements
                  </label>
                  <input
                    type="text"
                    value={fertilitySupplements}
                    onChange={(e) => setFertilitySupplements(e.target.value)}
                    placeholder="Antioxidants, CoQ10, Folic Acid, Vitamin D3"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Review Plan
                  </label>
                  <input
                    type="text"
                    value={followUpPlan}
                    onChange={(e) => setFollowUpPlan(e.target.value)}
                    placeholder="See with reports for and 3D scan + Smear/Speculum"
                    className="vmd-input text-xs"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Provisional Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    placeholder="Provisional Diagnosis"
                    className="vmd-input text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
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
