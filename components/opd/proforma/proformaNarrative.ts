export const defaultWifeTests = ['AMH', 'RBS', 'TSH', 'TPO', 'PRL', 'Rubella IgG', 'HbA1C'];
export const defaultHusbandTests = ['TSH', 'RBS', 'PRL', 'HbA1C'];
export const defaultPendingHusband = [
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
export const defaultPendingWife = [
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
export const defaultFoods = [
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

/**
 * Generate readable narrative medical prose from proforma data.
 * Rules:
 * 1. Only emit lines when the corresponding field has an actual non-null, non-empty value.
 * 2. Never output dummy or fallback default values (no '|| No', '|| Nil', '|| 28-30', etc.).
 * 3. Only emit section headings if at least one field in that section has a recorded value.
 */
export function generateProformaNarrative(data: any): string {
  if (!data) return '';

  const sections: string[] = [];

  // 1. Demographics & Referral
  const metaLines: string[] = [];
  if (data.referredBy?.trim()) metaLines.push(`Referred by: ${data.referredBy.trim()}`);
  if (data.livesIn?.trim()) metaLines.push(`Lives in: ${data.livesIn.trim()}`);
  if (data.seenByDr?.trim()) metaLines.push(`Seen by Dr: ${data.seenByDr.trim()}`);
  if (data.staffInAttendance?.trim()) metaLines.push(`Staff in attendance: ${data.staffInAttendance.trim()}`);
  if (metaLines.length > 0) sections.push(metaLines.join('\n'));

  // 2. Reason for Consultation
  if (data.reasonForConsultation?.trim()) {
    sections.push(`Reason for consultation:\n${data.reasonForConsultation.trim()}`);
  }

  // 3. Couple Infertility Profile (when activeTab is fertility)
  if (data.activeTab === 'fertility') {
    const coupleLines: string[] = [];
    if (data.fertilityType?.trim()) {
      if (data.fertilityFactor?.trim()) {
        coupleLines.push(`${data.fertilityType.trim()} infertility (${data.fertilityFactor.trim().toLowerCase()} factor)`);
      } else {
        coupleLines.push(`${data.fertilityType.trim()} infertility`);
      }
    } else if (data.fertilityFactor?.trim()) {
      coupleLines.push(`${data.fertilityFactor.trim()} factor infertility`);
    }
    if (data.marriedInYear?.trim()) coupleLines.push(`Married in year: ${data.marriedInYear.trim()}`);
    if (data.tryingForPregnancy?.trim()) coupleLines.push(`Been trying for pregnancy for ${data.tryingForPregnancy.trim()} years`);
    if (data.consanguinity?.trim()) coupleLines.push(`Consanguinity: ${data.consanguinity.trim()}`);
    if (coupleLines.length > 0) sections.push(coupleLines.join('\n'));
  }

  // 4. Female Partner Profile
  const femaleHead: string[] = [];
  if (data.femaleName?.trim()) femaleHead.push(`Female Name: ${data.femaleName.trim()}`);
  if (data.femaleProfession?.trim()) femaleHead.push(`Profession: ${data.femaleProfession.trim()}`);
  if (data.femaleWeight !== undefined && data.femaleWeight !== null && String(data.femaleWeight).trim() !== '') {
    femaleHead.push(`Weight: ${data.femaleWeight} kg`);
  }
  if (data.femaleBmi !== undefined && data.femaleBmi !== null && String(data.femaleBmi).trim() !== '') {
    femaleHead.push(`BMI: ${data.femaleBmi}`);
  }
  if (femaleHead.length > 0) sections.push(femaleHead.join('\n'));

  // 5. Menstrual History
  const mensesLines: string[] = [];
  if (data.periodsEvery?.trim()) mensesLines.push(`• Periods occur every ${data.periodsEvery.trim()} days`);
  if (data.durationBleeding?.trim()) mensesLines.push(`• Duration of bleeding: ${data.durationBleeding.trim()} days`);
  if (data.periodsPainful?.trim()) mensesLines.push(`• Are periods painful: ${data.periodsPainful.trim()}`);
  if (data.periodsHeavy?.trim()) mensesLines.push(`• Are periods heavy: ${data.periodsHeavy.trim()}`);
  if (data.ageAtMenarche && String(data.ageAtMenarche).trim()) mensesLines.push(`• Age at menarche: ${data.ageAtMenarche} years`);
  if (data.lmp?.trim()) mensesLines.push(`• LMP: ${data.lmp.trim()}`);
  if (data.menstrualAdditional?.trim()) mensesLines.push(`• Notes: ${data.menstrualAdditional.trim()}`);
  if (mensesLines.length > 0) sections.push(['MENSTRUAL HISTORY:', ...mensesLines].join('\n'));

  // 6. Obstetric History
  const obLines: string[] = [];
  if (data.gpal?.trim()) obLines.push(`Obstetric Score: ${data.gpal.trim()}`);
  const validObRows = (data.obRows || []).filter(
    (r: any) =>
      (r.year && r.year.trim()) ||
      (r.place && r.place.trim()) ||
      (r.details && r.details.trim()) ||
      (r.outcome && r.outcome.trim()) ||
      (r.gestation && r.gestation.trim()) ||
      (r.mode && r.mode.trim()) ||
      (r.babySexWeight && r.babySexWeight.trim())
  );
  if (validObRows.length > 0) {
    validObRows.forEach((r: any, idx: number) => {
      const parts: string[] = [];
      if (r.year?.trim()) parts.push(`Year: ${r.year.trim()}`);
      if (r.place?.trim()) parts.push(`Place: ${r.place.trim()}`);
      if (r.gestation?.trim()) parts.push(`Gestation: ${r.gestation.trim()}`);
      if (r.mode?.trim() || r.details?.trim()) parts.push(`Mode: ${(r.mode || r.details).trim()}`);
      if (r.outcome?.trim()) parts.push(`Outcome: ${r.outcome.trim()}`);
      if (r.babySexWeight?.trim()) parts.push(`Baby: ${r.babySexWeight.trim()}`);
      obLines.push(`  ${idx + 1}. ${parts.join(' | ')}`);
    });
  }
  if (obLines.length > 0) sections.push(['OBSTETRIC HISTORY:', ...obLines].join('\n'));

  // 7. Contraception History
  if (data.contraceptionHistory?.trim()) {
    sections.push(`CONTRACEPTION HISTORY: ${data.contraceptionHistory.trim()}`);
  }

  // 8. Female Habits
  const fHabits: string[] = [];
  if (data.femaleSmoking?.trim()) fHabits.push(`• Smoking: ${data.femaleSmoking.trim()}`);
  if (data.femaleGutka?.trim()) fHabits.push(`• Gutka: ${data.femaleGutka.trim()}`);
  if (data.femaleAlcohol?.trim()) fHabits.push(`• Alcohol: ${data.femaleAlcohol.trim()}`);
  if (data.femaleToddy?.trim()) fHabits.push(`• Toddy: ${data.femaleToddy.trim()}`);
  if (data.femaleCoffee?.trim()) fHabits.push(`• Coffee: ${data.femaleCoffee.trim()}`);
  if (fHabits.length > 0) sections.push(['HABITS / LIFESTYLE (FEMALE):', ...fHabits].join('\n'));

  // 9. Female Past Medical History
  const fMedLines: string[] = [];
  if (data.femaleAdmissions?.trim()) fMedLines.push(`• Hospital admissions (Non-surgical): ${data.femaleAdmissions.trim()}`);
  if (data.femaleRegularMed?.trim()) fMedLines.push(`• Regular medication: ${data.femaleRegularMed.trim()}`);
  if (data.femaleTb?.trim()) fMedLines.push(`• History of TB: ${data.femaleTb.trim()}`);
  if (data.femaleBleedingDisorders?.trim()) fMedLines.push(`• H/O bleeding or clotting disorders: ${data.femaleBleedingDisorders.trim()}`);
  if (data.femaleGalactorrhoea?.trim()) fMedLines.push(`• H/O Galactorrhoea: ${data.femaleGalactorrhoea.trim()}`);
  if (data.femaleAllergies?.trim()) fMedLines.push(`• Allergies: ${data.femaleAllergies.trim()}`);
  if (data.femaleCervicalSmear?.trim()) fMedLines.push(`• Cervical smears: ${data.femaleCervicalSmear.trim()}`);
  if (fMedLines.length > 0) sections.push(['PAST MEDICAL HISTORY (FEMALE):', ...fMedLines].join('\n'));

  // 10. Female Past Surgical History
  if (data.femalePastSurgical?.trim()) {
    sections.push(`PAST SURGICAL HISTORY (FEMALE): ${data.femalePastSurgical.trim()}`);
  }

  // 11. Female Family History
  const fFam = Array.isArray(data.femaleFamilyHistory)
    ? data.femaleFamilyHistory.filter((x: any) => typeof x === 'string' && x.trim()).join(', ')
    : typeof data.femaleFamilyHistory === 'string'
    ? data.femaleFamilyHistory.trim()
    : '';
  if (fFam) sections.push(`FAMILY HISTORY (FEMALE): ${fFam}`);

  // 12. Female Physical Examination
  const fExam: string[] = [];
  if (data.femalePallor?.trim()) fExam.push(`Pallor: ${data.femalePallor.trim()}`);
  if (data.femalePedalEdema?.trim()) fExam.push(`Pedal edema: ${data.femalePedalEdema.trim()}`);
  if (data.femaleGoitre?.trim()) fExam.push(`Goitre: ${data.femaleGoitre.trim()}`);
  if (data.femaleBp?.trim()) fExam.push(`BP: ${data.femaleBp.trim()} mmHg`);
  if (fExam.length > 0) sections.push(['EXAMINATION (FEMALE):', ...fExam].join('\n'));

  // 13. Male Partner Evaluation (when activeTab is fertility)
  if (data.activeTab === 'fertility') {
    const maleHead: string[] = [];
    if (data.maleName?.trim()) maleHead.push(`Male Name: ${data.maleName.trim()}`);
    if (data.maleProfession?.trim()) maleHead.push(`Profession: ${data.maleProfession.trim()}`);
    if (data.maleWeight !== undefined && data.maleWeight !== null && String(data.maleWeight).trim() !== '') {
      maleHead.push(`Weight: ${data.maleWeight} kg`);
    }
    if (data.maleBmi !== undefined && data.maleBmi !== null && String(data.maleBmi).trim() !== '') {
      maleHead.push(`BMI: ${data.maleBmi}`);
    }
    if (maleHead.length > 0) sections.push(maleHead.join('\n'));

    const mSexual: string[] = [];
    if (data.maleErectileIssues?.trim()) mSexual.push(`• Problems with erection or ejaculation: ${data.maleErectileIssues.trim()}`);
    if (data.frequencyIntercourse?.trim()) mSexual.push(`• Frequency of intercourse per week: ${data.frequencyIntercourse.trim()}`);
    if (data.maleDyspareunia?.trim()) mSexual.push(`• Pain during sexual intercourse: ${data.maleDyspareunia.trim()}`);
    if (data.maleLastSi?.trim()) mSexual.push(`• Last SI: ${data.maleLastSi.trim()}`);
    if (data.maleScrotalInjury?.trim()) mSexual.push(`• Groin/scrotal injury: ${data.maleScrotalInjury.trim()}`);
    if (data.maleMumps?.trim()) mSexual.push(`• Mumps in past/childhood: ${data.maleMumps.trim()}`);
    if (mSexual.length > 0) sections.push(['MALE REPRODUCTIVE & SEXUAL HISTORY:', ...mSexual].join('\n'));

    const mHabits: string[] = [];
    if (data.maleSmoking?.trim()) mHabits.push(`• Smoking: ${data.maleSmoking.trim()}`);
    if (data.maleGutka?.trim()) mHabits.push(`• Gutka: ${data.maleGutka.trim()}`);
    if (data.maleAlcohol?.trim()) mHabits.push(`• Alcohol: ${data.maleAlcohol.trim()}`);
    if (data.maleToddy?.trim()) mHabits.push(`• Toddy: ${data.maleToddy.trim()}`);
    if (data.maleCoffee?.trim()) mHabits.push(`• Coffee: ${data.maleCoffee.trim()}`);
    if (mHabits.length > 0) sections.push(['HABITS / LIFESTYLE (MALE):', ...mHabits].join('\n'));

    const mMed: string[] = [];
    if (data.maleAdmissions?.trim()) mMed.push(`• Hospital admissions: ${data.maleAdmissions.trim()}`);
    if (data.maleRegularMed?.trim()) mMed.push(`• Regular medication: ${data.maleRegularMed.trim()}`);
    if (data.maleTb?.trim()) mMed.push(`• History of TB: ${data.maleTb.trim()}`);
    if (data.maleAllergies?.trim()) mMed.push(`• Allergies: ${data.maleAllergies.trim()}`);
    if (mMed.length > 0) sections.push(['PAST MEDICAL HISTORY (MALE):', ...mMed].join('\n'));

    if (data.malePastSurgical?.trim()) {
      sections.push(`PAST SURGICAL HISTORY (MALE): ${data.malePastSurgical.trim()}`);
    }

    const mFam = Array.isArray(data.maleFamilyHistory)
      ? data.maleFamilyHistory.filter((x: any) => typeof x === 'string' && x.trim()).join(', ')
      : typeof data.maleFamilyHistory === 'string'
      ? data.maleFamilyHistory.trim()
      : '';
    if (mFam) sections.push(`FAMILY HISTORY (MALE): ${mFam}`);

    const mExam: string[] = [];
    if (data.malePallor?.trim()) mExam.push(`Pallor: ${data.malePallor.trim()}`);
    if (data.malePedalEdema?.trim()) mExam.push(`Pedal edema: ${data.malePedalEdema.trim()}`);
    if (data.maleGoitre?.trim()) mExam.push(`Goitre: ${data.maleGoitre.trim()}`);
    if (data.maleBp?.trim()) mExam.push(`BP: ${data.maleBp.trim()} mmHg`);
    if (mExam.length > 0) sections.push(['EXAMINATION (MALE):', ...mExam].join('\n'));
  }

  // 14. Fertility Investigations
  const invLines: string[] = [];
  if (data.invAmh?.trim()) invLines.push(`• AMH: ${data.invAmh.trim()}`);
  if (data.invFsh?.trim()) invLines.push(`• FSH: ${data.invFsh.trim()}`);
  if (data.invLh?.trim()) invLines.push(`• LH: ${data.invLh.trim()}`);
  if (data.invTsh?.trim()) invLines.push(`• TSH: ${data.invTsh.trim()}`);
  if (data.invTubalPatency?.trim()) invLines.push(`• Tubal patency: ${data.invTubalPatency.trim()}`);
  if (data.invHysteroLap?.trim()) invLines.push(`• Hysteroscopy / Laparoscopy: ${data.invHysteroLap.trim()}`);
  if (data.invSemenAnalysis?.trim()) invLines.push(`• Semen analysis: ${data.invSemenAnalysis.trim()}`);
  if (data.invDfi?.trim()) invLines.push(`• Sperm DFI: ${data.invDfi.trim()}`);
  if (invLines.length > 0) sections.push(['FERTILITY INVESTIGATIONS:', ...invLines].join('\n'));

  // 15. Fertility Treatments (Past)
  if (data.fertilityTreatments?.trim()) {
    sections.push(`FERTILITY TREATMENTS (PAST):\n${data.fertilityTreatments.trim()}`);
  }

  // 16. Consultation Notes & Physical Examination (P/A, P/S, P/V, 3D Scan)
  const notesLines: string[] = [];
  if (data.fertilityCounselingDone === true) {
    notesLines.push('Fertility counseling completed (hormones, ovulation, tubal patency and semen explained)');
  }
  if (data.paFindings?.trim()) notesLines.push(`P/A: ${data.paFindings.trim()}`);
  if (data.paScars?.trim()) notesLines.push(`Abdominal Scars: ${data.paScars.trim()}`);

  const psLines: string[] = [];
  if (data.psVulvaVagina?.trim()) psLines.push(`Vulva / Vagina: ${data.psVulvaVagina.trim()}`);
  if (data.psCervixHealthy !== null && data.psCervixHealthy !== undefined && data.psCervixHealthy !== '') {
    psLines.push(`Cervix: ${data.psCervixHealthy ? 'Healthy appearance' : 'Abnormal appearance'}`);
  }
  if (data.psCervixEctropion) psLines.push('Cervix ectropion noted');
  if (data.psCervicalSmearDone) psLines.push('Cervical smear done (LBC)');
  if (data.psBleedingOnTouch) psLines.push('Bleeding on touch noted');
  if (psLines.length > 0) notesLines.push(`P/S: ${psLines.join('. ')}`);

  const pvParts: string[] = [];
  if (data.pvUterusPosition?.trim()) pvParts.push(`Position: ${data.pvUterusPosition.trim()}`);
  if (data.pvUterusSize?.trim()) pvParts.push(`Size: ${data.pvUterusSize.trim()}`);
  if (data.pvUterusMobility?.trim()) pvParts.push(`Mobility: ${data.pvUterusMobility.trim()}`);
  if (pvParts.length > 0) notesLines.push(`P/V - Uterus: ${pvParts.join(' | ')}`);
  if (data.pvFornicesTenderness?.trim()) notesLines.push(`Fornices Tenderness: ${data.pvFornicesTenderness.trim()}`);

  if (data.threeDScan?.trim()) notesLines.push(`3-D Scan Findings:\n${data.threeDScan.trim()}`);
  if (data.factorsInFavour?.trim()) notesLines.push(`Factors in favour:\n${data.factorsInFavour.trim()}`);
  if (data.factorsNotInFavour?.trim()) notesLines.push(`Factors not in favour:\n${data.factorsNotInFavour.trim()}`);
  if (notesLines.length > 0) sections.push(['CLINICAL NOTES & LOCAL EXAMINATION:', ...notesLines].join('\n'));

  // 17. Recommended Basic Investigations
  const recLines: string[] = [];
  if (data.recommendedWifeTests?.length) {
    recLines.push(`• Wife: ${data.recommendedWifeTests.join(', ')}`);
  }
  if (data.recommendedHusbandTests?.length) {
    recLines.push(`• Husband: ${data.recommendedHusbandTests.join(', ')}`);
  }
  if (data.recSemenAnalysis) {
    recLines.push('• Semen analysis (3-7 days abstinence, BY APPOINTMENT ONLY, 9 AM - 11 AM)');
  }
  if (data.recDfi) {
    recLines.push('• Sperm DNA Fragmentation DFI (2 days abstinence, BY APPOINTMENT ONLY, 9 AM - 11 AM)');
  }
  const hasPending = (data.pendingHusbandTests?.length || 0) > 0 || (data.pendingWifeTests?.length || 0) > 0;
  if (hasPending) {
    recLines.push('Pending Serology / Pre-op Panels:');
    if (data.pendingHusbandTests?.length) recLines.push(`  - Husband: ${data.pendingHusbandTests.join(', ')}`);
    if (data.pendingWifeTests?.length) recLines.push(`  - Wife: ${data.pendingWifeTests.join(', ')}`);
  }
  if (recLines.length > 0) sections.push(['RECOMMENDED BASIC INVESTIGATIONS:', ...recLines].join('\n'));

  // 18. Advised
  const advLines: string[] = [];
  if (data.fertilityFoods?.length) {
    advLines.push(`Fertility foods: ${data.fertilityFoods.join(', ')}`);
  }
  if (data.fertilitySupplements?.trim()) {
    advLines.push(`Fertility Supplements: ${data.fertilitySupplements.trim()}`);
  }
  if (data.followUpPlan?.trim()) {
    advLines.push(`Review Plan: ${data.followUpPlan.trim()}`);
  }
  if (advLines.length > 0) sections.push(['ADVISED REGIMEN & PLAN:', ...advLines].join('\n'));

  // 19. Gynaecology & Obstetric Specifics
  if (data.activeTab === 'gynaecology') {
    const gynLines: string[] = [];
    if (data.gynaeSmearResult?.trim()) gynLines.push(`Cervical Smear: ${data.gynaeSmearResult.trim()}`);
    if (data.gynaeHpv?.trim()) gynLines.push(`HPV Status: ${data.gynaeHpv.trim()}`);
    if (gynLines.length > 0) sections.push(['GYNAECOLOGY SPECIFICS:', ...gynLines].join('\n'));
  }

  if (data.activeTab === 'obstetric') {
    const obLines: string[] = [];
    if (data.edd?.trim()) obLines.push(`EDD: ${data.edd.trim()}`);
    if (data.gestationalAge?.trim()) obLines.push(`Gestational Age: ${data.gestationalAge.trim()}`);
    if (data.conceptionMode?.trim()) obLines.push(`Mode of Conception: ${data.conceptionMode.trim()}`);
    if (data.currentPregnancyNotes?.trim()) obLines.push(`Current Pregnancy Notes: ${data.currentPregnancyNotes.trim()}`);
    if (obLines.length > 0) sections.push(['OBSTETRIC ANTENATAL DETAILS:', ...obLines].join('\n'));
  }

  // 20. Provisional Diagnosis & Consultant
  if (data.finalDiagnosis?.trim()) {
    sections.push(`Provisional Diagnosis:\n${data.finalDiagnosis.trim()}`);
  }
  if (data.seenByDr?.trim()) {
    sections.push(`Consultant's Name: ${data.seenByDr.trim()}`);
  }

  return sections.join('\n\n');
}

/**
 * Generate Chronological Present History narrative (HPI):
 * Only includes Present Infertility/Gynae/Obs history, Menstrual, Obstetric events,
 * Habits, Male sexual history, and past fertility investigations.
 * Excludes: Chief Complaints (in complaints field), Past Medical/Surgical (in past history),
 * Examination findings (in examination field), Orders & Plan (in Section 2).
 */
export function generatePresentHistoryNarrative(data: any): string {
  if (!data) return '';
  const sections: string[] = [];

  // Couple Infertility Profile (when activeTab is fertility)
  if (data.activeTab === 'fertility') {
    const coupleLines: string[] = [];
    if (data.fertilityType?.trim()) {
      if (data.fertilityFactor?.trim()) {
        coupleLines.push(`${data.fertilityType.trim()} infertility (${data.fertilityFactor.trim().toLowerCase()} factor)`);
      } else {
        coupleLines.push(`${data.fertilityType.trim()} infertility`);
      }
    } else if (data.fertilityFactor?.trim()) {
      coupleLines.push(`${data.fertilityFactor.trim()} factor infertility`);
    }
    if (data.marriedInYear?.trim()) coupleLines.push(`Married in year: ${data.marriedInYear.trim()}`);
    if (data.tryingForPregnancy?.trim()) coupleLines.push(`Been trying for pregnancy for ${data.tryingForPregnancy.trim()} years`);
    if (data.consanguinity?.trim()) coupleLines.push(`Consanguinity: ${data.consanguinity.trim()}`);
    if (coupleLines.length > 0) sections.push(coupleLines.join('\n'));
  }

  // Female Partner Profile
  const femaleHead: string[] = [];
  if (data.femaleName?.trim()) femaleHead.push(`Female Name: ${data.femaleName.trim()}`);
  if (data.femaleProfession?.trim()) femaleHead.push(`Profession: ${data.femaleProfession.trim()}`);
  if (femaleHead.length > 0) sections.push(femaleHead.join('\n'));

  // Menstrual History
  const mensesLines: string[] = [];
  if (data.periodsEvery?.trim()) mensesLines.push(`• Periods occur every ${data.periodsEvery.trim()} days`);
  if (data.durationBleeding?.trim()) mensesLines.push(`• Duration of bleeding: ${data.durationBleeding.trim()} days`);
  if (data.periodsPainful?.trim()) mensesLines.push(`• Are periods painful: ${data.periodsPainful.trim()}`);
  if (data.periodsHeavy?.trim()) mensesLines.push(`• Are periods heavy: ${data.periodsHeavy.trim()}`);
  if (data.ageAtMenarche && String(data.ageAtMenarche).trim()) mensesLines.push(`• Age at menarche: ${data.ageAtMenarche} years`);
  if (data.lmp?.trim()) mensesLines.push(`• LMP: ${data.lmp.trim()}`);
  if (data.menstrualAdditional?.trim()) mensesLines.push(`• Notes: ${data.menstrualAdditional.trim()}`);
  if (mensesLines.length > 0) sections.push(['MENSTRUAL HISTORY:', ...mensesLines].join('\n'));

  // Obstetric History
  const obLines: string[] = [];
  if (data.gpal?.trim()) obLines.push(`Obstetric Score: ${data.gpal.trim()}`);
  const validObRows = (data.obRows || []).filter(
    (r: any) =>
      (r.year && r.year.trim()) ||
      (r.place && r.place.trim()) ||
      (r.details && r.details.trim()) ||
      (r.outcome && r.outcome.trim()) ||
      (r.gestation && r.gestation.trim()) ||
      (r.mode && r.mode.trim()) ||
      (r.babySexWeight && r.babySexWeight.trim())
  );
  if (validObRows.length > 0) {
    validObRows.forEach((r: any, idx: number) => {
      const parts: string[] = [];
      if (r.year?.trim()) parts.push(`Year: ${r.year.trim()}`);
      if (r.place?.trim()) parts.push(`Place: ${r.place.trim()}`);
      if (r.gestation?.trim()) parts.push(`Gestation: ${r.gestation.trim()}`);
      if (r.mode?.trim() || r.details?.trim()) parts.push(`Mode: ${(r.mode || r.details).trim()}`);
      if (r.outcome?.trim()) parts.push(`Outcome: ${r.outcome.trim()}`);
      if (r.babySexWeight?.trim()) parts.push(`Baby: ${r.babySexWeight.trim()}`);
      obLines.push(`  ${idx + 1}. ${parts.join(' | ')}`);
    });
  }
  if (obLines.length > 0) sections.push(['OBSTETRIC HISTORY:', ...obLines].join('\n'));

  // Contraception History
  if (data.contraceptionHistory?.trim()) {
    sections.push(`CONTRACEPTION HISTORY: ${data.contraceptionHistory.trim()}`);
  }

  // Female Habits
  const fHabits: string[] = [];
  if (data.femaleSmoking?.trim()) fHabits.push(`• Smoking: ${data.femaleSmoking.trim()}`);
  if (data.femaleGutka?.trim()) fHabits.push(`• Gutka: ${data.femaleGutka.trim()}`);
  if (data.femaleAlcohol?.trim()) fHabits.push(`• Alcohol: ${data.femaleAlcohol.trim()}`);
  if (data.femaleToddy?.trim()) fHabits.push(`• Toddy: ${data.femaleToddy.trim()}`);
  if (data.femaleCoffee?.trim()) fHabits.push(`• Coffee: ${data.femaleCoffee.trim()}`);
  if (fHabits.length > 0) sections.push(['HABITS / LIFESTYLE (FEMALE):', ...fHabits].join('\n'));

  // Male Partner Profile & Reproductive / Sexual History (when activeTab is fertility)
  if (data.activeTab === 'fertility') {
    const maleHead: string[] = [];
    if (data.maleName?.trim()) maleHead.push(`Male Name: ${data.maleName.trim()}`);
    if (data.maleProfession?.trim()) maleHead.push(`Profession: ${data.maleProfession.trim()}`);
    if (maleHead.length > 0) sections.push(maleHead.join('\n'));

    const mSexual: string[] = [];
    if (data.maleErectileIssues?.trim()) mSexual.push(`• Problems with erection or ejaculation: ${data.maleErectileIssues.trim()}`);
    if (data.frequencyIntercourse?.trim()) mSexual.push(`• Frequency of intercourse per week: ${data.frequencyIntercourse.trim()}`);
    if (data.maleDyspareunia?.trim()) mSexual.push(`• Pain during sexual intercourse: ${data.maleDyspareunia.trim()}`);
    if (data.maleLastSi?.trim()) mSexual.push(`• Last SI: ${data.maleLastSi.trim()}`);
    if (data.maleScrotalInjury?.trim()) mSexual.push(`• Groin/scrotal injury: ${data.maleScrotalInjury.trim()}`);
    if (data.maleMumps?.trim()) mSexual.push(`• Mumps in past/childhood: ${data.maleMumps.trim()}`);
    if (mSexual.length > 0) sections.push(['MALE REPRODUCTIVE & SEXUAL HISTORY:', ...mSexual].join('\n'));

    const mHabits: string[] = [];
    if (data.maleSmoking?.trim()) mHabits.push(`• Smoking: ${data.maleSmoking.trim()}`);
    if (data.maleGutka?.trim()) mHabits.push(`• Gutka: ${data.maleGutka.trim()}`);
    if (data.maleAlcohol?.trim()) mHabits.push(`• Alcohol: ${data.maleAlcohol.trim()}`);
    if (data.maleToddy?.trim()) mHabits.push(`• Toddy: ${data.maleToddy.trim()}`);
    if (data.maleCoffee?.trim()) mHabits.push(`• Coffee: ${data.maleCoffee.trim()}`);
    if (mHabits.length > 0) sections.push(['HABITS / LIFESTYLE (MALE):', ...mHabits].join('\n'));
  }

  // Fertility Investigations (Past baseline)
  const invLines: string[] = [];
  if (data.invAmh?.trim()) invLines.push(`• AMH: ${data.invAmh.trim()}`);
  if (data.invFsh?.trim()) invLines.push(`• FSH: ${data.invFsh.trim()}`);
  if (data.invLh?.trim()) invLines.push(`• LH: ${data.invLh.trim()}`);
  if (data.invTsh?.trim()) invLines.push(`• TSH: ${data.invTsh.trim()}`);
  if (data.invTubalPatency?.trim()) invLines.push(`• Tubal patency: ${data.invTubalPatency.trim()}`);
  if (data.invHysteroLap?.trim()) invLines.push(`• Hysteroscopy / Laparoscopy: ${data.invHysteroLap.trim()}`);
  if (data.invSemenAnalysis?.trim()) invLines.push(`• Semen analysis: ${data.invSemenAnalysis.trim()}`);
  if (data.invDfi?.trim()) invLines.push(`• Sperm DFI: ${data.invDfi.trim()}`);
  if (invLines.length > 0) sections.push(['FERTILITY INVESTIGATIONS:', ...invLines].join('\n'));

  // Fertility Treatments (Past)
  if (data.fertilityTreatments?.trim()) {
    sections.push(`FERTILITY TREATMENTS (PAST):\n${data.fertilityTreatments.trim()}`);
  }

  // Gynaecology Specifics
  if (data.activeTab === 'gynaecology') {
    const gynLines: string[] = [];
    if (data.gynaeSmearResult?.trim()) gynLines.push(`Cervical Smear: ${data.gynaeSmearResult.trim()}`);
    if (data.gynaeHpv?.trim()) gynLines.push(`HPV Status: ${data.gynaeHpv.trim()}`);
    if (gynLines.length > 0) sections.push(['GYNAECOLOGY SPECIFICS:', ...gynLines].join('\n'));
  }

  // Obstetric Specifics
  if (data.activeTab === 'obstetric') {
    const obLines: string[] = [];
    if (data.edd?.trim()) obLines.push(`EDD: ${data.edd.trim()}`);
    if (data.gestationalAge?.trim()) obLines.push(`Gestational Age: ${data.gestationalAge.trim()}`);
    if (data.conceptionMode?.trim()) obLines.push(`Mode of Conception: ${data.conceptionMode.trim()}`);
    if (data.currentPregnancyNotes?.trim()) obLines.push(`Current Pregnancy Notes: ${data.currentPregnancyNotes.trim()}`);
    if (obLines.length > 0) sections.push(['OBSTETRIC ANTENATAL DETAILS:', ...obLines].join('\n'));
  }

  return sections.join('\n\n');
}

/**
 * Generate Past Medical, Surgical, Allergy & Family History narrative:
 * Strictly routes to previous_history field without repeating in present_history.
 */
export function generatePastHistoryNarrative(data: any): string {
  if (!data) return '';
  const sections: string[] = [];

  // Female Past Medical History
  const fMedLines: string[] = [];
  if (data.femaleAdmissions?.trim()) fMedLines.push(`• Hospital admissions (Non-surgical): ${data.femaleAdmissions.trim()}`);
  if (data.femaleRegularMed?.trim()) fMedLines.push(`• Regular medication: ${data.femaleRegularMed.trim()}`);
  if (data.femaleTb?.trim()) fMedLines.push(`• History of TB: ${data.femaleTb.trim()}`);
  if (data.femaleBleedingDisorders?.trim()) fMedLines.push(`• H/O bleeding or clotting disorders: ${data.femaleBleedingDisorders.trim()}`);
  if (data.femaleGalactorrhoea?.trim()) fMedLines.push(`• H/O Galactorrhoea: ${data.femaleGalactorrhoea.trim()}`);
  if (data.femaleAllergies?.trim()) fMedLines.push(`• Allergies: ${data.femaleAllergies.trim()}`);
  if (data.femaleCervicalSmear?.trim()) fMedLines.push(`• Cervical smears: ${data.femaleCervicalSmear.trim()}`);
  if (fMedLines.length > 0) sections.push(['PAST MEDICAL HISTORY (FEMALE):', ...fMedLines].join('\n'));

  // Female Past Surgical History
  if (data.femalePastSurgical?.trim()) {
    sections.push(`PAST SURGICAL HISTORY (FEMALE): ${data.femalePastSurgical.trim()}`);
  }

  // Female Family History
  const fFam = Array.isArray(data.femaleFamilyHistory)
    ? data.femaleFamilyHistory.filter((x: any) => typeof x === 'string' && x.trim()).join(', ')
    : typeof data.femaleFamilyHistory === 'string'
    ? data.femaleFamilyHistory.trim()
    : '';
  if (fFam) sections.push(`FAMILY HISTORY (FEMALE): ${fFam}`);

  // Male Past Medical & Surgical (when activeTab is fertility)
  if (data.activeTab === 'fertility') {
    const mMed: string[] = [];
    if (data.maleAdmissions?.trim()) mMed.push(`• Hospital admissions: ${data.maleAdmissions.trim()}`);
    if (data.maleRegularMed?.trim()) mMed.push(`• Regular medication: ${data.maleRegularMed.trim()}`);
    if (data.maleTb?.trim()) mMed.push(`• History of TB: ${data.maleTb.trim()}`);
    if (data.maleAllergies?.trim()) mMed.push(`• Allergies: ${data.maleAllergies.trim()}`);
    if (mMed.length > 0) sections.push(['PAST MEDICAL HISTORY (MALE):', ...mMed].join('\n'));

    if (data.malePastSurgical?.trim()) {
      sections.push(`PAST SURGICAL HISTORY (MALE): ${data.malePastSurgical.trim()}`);
    }

    const mFam = Array.isArray(data.maleFamilyHistory)
      ? data.maleFamilyHistory.filter((x: any) => typeof x === 'string' && x.trim()).join(', ')
      : typeof data.maleFamilyHistory === 'string'
      ? data.maleFamilyHistory.trim()
      : '';
    if (mFam) sections.push(`FAMILY HISTORY (MALE): ${mFam}`);
  }

  return sections.join('\n\n');
}

/**
 * Generate Physical and Local Pelvic Examination narrative:
 * Strictly routes to examination field without repeating in present_history.
 */
export function generateExaminationNarrative(data: any): string {
  if (!data) return '';
  const sections: string[] = [];

  // Female General Examination
  const fExam: string[] = [];
  if (data.femalePallor?.trim()) fExam.push(`Pallor: ${data.femalePallor.trim()}`);
  if (data.femalePedalEdema?.trim()) fExam.push(`Pedal edema: ${data.femalePedalEdema.trim()}`);
  if (data.femaleGoitre?.trim()) fExam.push(`Goitre: ${data.femaleGoitre.trim()}`);
  if (data.femaleBp?.trim()) fExam.push(`BP: ${data.femaleBp.trim()} mmHg`);
  if (fExam.length > 0) sections.push(['GENERAL EXAMINATION (FEMALE):', ...fExam].join('\n'));

  // Male General Examination
  if (data.activeTab === 'fertility') {
    const mExam: string[] = [];
    if (data.malePallor?.trim()) mExam.push(`Pallor: ${data.malePallor.trim()}`);
    if (data.malePedalEdema?.trim()) mExam.push(`Pedal edema: ${data.malePedalEdema.trim()}`);
    if (data.maleGoitre?.trim()) mExam.push(`Goitre: ${data.maleGoitre.trim()}`);
    if (data.maleBp?.trim()) mExam.push(`BP: ${data.maleBp.trim()} mmHg`);
    if (mExam.length > 0) sections.push(['GENERAL EXAMINATION (MALE):', ...mExam].join('\n'));
  }

  // Clinical Pelvic & Local Examination
  const notesLines: string[] = [];
  if (data.fertilityCounselingDone === true) {
    notesLines.push('Fertility counseling completed (hormones, ovulation, tubal patency and semen explained)');
  }
  if (data.paFindings?.trim()) notesLines.push(`P/A: ${data.paFindings.trim()}`);
  if (data.paScars?.trim()) notesLines.push(`Abdominal Scars: ${data.paScars.trim()}`);

  const psLines: string[] = [];
  if (data.psVulvaVagina?.trim()) psLines.push(`Vulva / Vagina: ${data.psVulvaVagina.trim()}`);
  if (data.psCervixHealthy !== null && data.psCervixHealthy !== undefined && data.psCervixHealthy !== '') {
    psLines.push(`Cervix: ${data.psCervixHealthy ? 'Healthy appearance' : 'Abnormal appearance'}`);
  }
  if (data.psCervixEctropion) psLines.push('Cervix ectropion noted');
  if (data.psCervicalSmearDone) psLines.push('Cervical smear done (LBC)');
  if (data.psBleedingOnTouch) psLines.push('Bleeding on touch noted');
  if (psLines.length > 0) notesLines.push(`P/S: ${psLines.join('. ')}`);

  const pvParts: string[] = [];
  if (data.pvUterusPosition?.trim()) pvParts.push(`Position: ${data.pvUterusPosition.trim()}`);
  if (data.pvUterusSize?.trim()) pvParts.push(`Size: ${data.pvUterusSize.trim()}`);
  if (data.pvUterusMobility?.trim()) pvParts.push(`Mobility: ${data.pvUterusMobility.trim()}`);
  if (pvParts.length > 0) notesLines.push(`P/V - Uterus: ${pvParts.join(' | ')}`);
  if (data.pvFornicesTenderness?.trim()) notesLines.push(`Fornices Tenderness: ${data.pvFornicesTenderness.trim()}`);

  if (data.threeDScan?.trim()) notesLines.push(`3-D Scan Findings:\n${data.threeDScan.trim()}`);
  if (data.factorsInFavour?.trim()) notesLines.push(`Factors in favour:\n${data.factorsInFavour.trim()}`);
  if (data.factorsNotInFavour?.trim()) notesLines.push(`Factors not in favour:\n${data.factorsNotInFavour.trim()}`);
  if (notesLines.length > 0) sections.push(['CLINICAL NOTES & LOCAL EXAMINATION:', ...notesLines].join('\n'));

  return sections.join('\n\n');
}
