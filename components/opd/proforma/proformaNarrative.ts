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

export function generateProformaNarrative(data: any): string {
  const sections: string[] = [];

  // 1. Demographics & Referral
  const metaLines: string[] = [];
  if (data.referredBy) metaLines.push(`Referred by: ${data.referredBy}`);
  if (data.livesIn) metaLines.push(`Lives in: ${data.livesIn}`);
  if (metaLines.length > 0) sections.push(metaLines.join('\n'));

  const seenLines: string[] = [];
  if (data.seenByDr) seenLines.push(`Seen by Dr: ${data.seenByDr}`);
  if (data.staffInAttendance) seenLines.push(`Staff in attendance: ${data.staffInAttendance}`);
  if (seenLines.length > 0) sections.push(seenLines.join('\n'));

  // 2. Reason for Consultation
  if (data.reasonForConsultation) {
    sections.push(`Reason for consultation:\n${data.reasonForConsultation}`);
  }

  // 3. Couple Infertility Profile
  if (data.activeTab === 'fertility') {
    const coupleLines: string[] = [];
    const infType = data.fertilityType || 'Primary';
    const infFactor = data.fertilityFactor || 'Couple';
    coupleLines.push(`${infType} infertility (${infFactor.toLowerCase()} factor)`);
    if (data.marriedInYear) coupleLines.push(`Married in year: ${data.marriedInYear}`);
    if (data.tryingForPregnancy) {
      coupleLines.push(`Been trying for pregnancy for ${data.tryingForPregnancy} years`);
    } else {
      coupleLines.push('Been trying for pregnancy');
    }
    coupleLines.push(data.consanguinity || 'Non-Consanguineous');
    sections.push(coupleLines.join('\n'));
  }

  // 4. Female Partner Profile
  const femaleHead: string[] = [];
  femaleHead.push(`Female Name: ${data.femaleName || 'Patient'}`);
  if (data.femaleProfession) femaleHead.push(`Profession: ${data.femaleProfession}`);
  if (data.femaleWeight) femaleHead.push(`Weight: ${data.femaleWeight} kg`);
  if (data.femaleBmi) femaleHead.push(`BMI: ${data.femaleBmi}`);
  if (femaleHead.length > 0) sections.push(femaleHead.join('\n'));

  // 5. Menstrual History
  const mensesLines: string[] = ['MENSTRUAL HISTORY:'];
  mensesLines.push(`• Periods occur every ${data.periodsEvery || '28-30'} days`);
  mensesLines.push(`• Duration of bleeding: ${data.durationBleeding || '4-5'} days`);
  mensesLines.push(`• Are your periods painful? ${data.periodsPainful || 'No'}`);
  mensesLines.push(`• Are your periods heavy? ${data.periodsHeavy || 'No'}`);
  if (data.ageAtMenarche) mensesLines.push(`• Age at menarche: ${data.ageAtMenarche} years`);
  if (data.lmp) mensesLines.push(`• LMP: ${data.lmp}`);
  if (data.menstrualAdditional) mensesLines.push(`• Notes: ${data.menstrualAdditional}`);
  sections.push(mensesLines.join('\n'));

  // 6. Obstetric History
  const obLines: string[] = ['OBSTETRIC HISTORY:'];
  if (data.gpal) obLines.push(`Obstetric Score: ${data.gpal}`);
  const validObRows = (data.obRows || []).filter(
    (r: any) => r.year || r.place || r.details || r.outcome
  );
  if (validObRows.length > 0) {
    validObRows.forEach((r: any, idx: number) => {
      obLines.push(
        `  ${idx + 1}. Year: ${r.year || '—'} | Place: ${r.place || '—'} | Mode: ${
          r.details || '—'
        } | Outcome: ${r.outcome || '—'}`
      );
    });
  } else {
    obLines.push('Nulligravida (No past pregnancies)');
  }
  sections.push(obLines.join('\n'));

  // 7. Contraception History
  if (data.contraceptionHistory) {
    sections.push(`CONTRACEPTION HISTORY: ${data.contraceptionHistory}`);
  }

  // 8. Female Habits
  const fHabits: string[] = ['HABITS / LIFESTYLE (FEMALE):'];
  fHabits.push(`• Smoking: ${data.femaleSmoking || 'No'}`);
  fHabits.push(`• Gutka: ${data.femaleGutka || 'No'}`);
  fHabits.push(`• Alcohol: ${data.femaleAlcohol || 'No'}`);
  fHabits.push(`• Toddy: ${data.femaleToddy || 'No'}`);
  fHabits.push(`• Coffee: ${data.femaleCoffee || 'None'}`);
  sections.push(fHabits.join('\n'));

  // 9. Female Past Medical History
  const fMedLines: string[] = ['PAST MEDICAL HISTORY (FEMALE):'];
  fMedLines.push(`• Hospital admissions (Non-surgical): ${data.femaleAdmissions || 'Nil'}`);
  fMedLines.push(`• Regular medication: ${data.femaleRegularMed || 'None'}`);
  fMedLines.push(`• History of TB: ${data.femaleTb || 'No'}`);
  fMedLines.push(
    `• H/O any bleeding or clotting disorders: ${data.femaleBleedingDisorders || 'No'}`
  );
  fMedLines.push(`• H/O Galactorrhoea: ${data.femaleGalactorrhoea || 'No'}`);
  fMedLines.push(`• Allergies: ${data.femaleAllergies || 'No known drug allergies (NKDA)'}`);
  fMedLines.push(`• Cervical smears: ${data.femaleCervicalSmear || 'Not done / Normal'}`);
  sections.push(fMedLines.join('\n'));

  // 10. Female Past Surgical History
  sections.push(`PAST SURGICAL HISTORY (FEMALE): ${data.femalePastSurgical || 'Nil'}`);

  // 11. Female Family History
  const fFam = Array.isArray(data.femaleFamilyHistory)
    ? data.femaleFamilyHistory.join(', ')
    : data.femaleFamilyHistory;
  sections.push(`FAMILY HISTORY OF DM, HTN, CANCERS: ${fFam || 'Non-contributory'}`);

  // 12. Female Physical Examination
  const fExam: string[] = ['EXAMINATION (FEMALE):'];
  fExam.push(`O/E ${data.femalePallor === 'Present' ? 'Pallor present' : 'No pallor'}`);
  fExam.push(`${data.femalePedalEdema === 'Present' ? 'Pedal edema present' : 'No pedal edema'}`);
  fExam.push(`${data.femaleGoitre === 'Present' ? 'Goitre present' : 'No goitre'}`);
  fExam.push(`BP: ${data.femaleBp || '—'} mm Hg`);
  sections.push(fExam.join('\n'));

  // 13. Male Partner Evaluation (Fertility Tab)
  if (data.activeTab === 'fertility') {
    const maleHead: string[] = [];
    maleHead.push(`Male Name: ${data.maleName || 'Partner'}`);
    if (data.maleProfession) maleHead.push(`Profession: ${data.maleProfession}`);
    if (data.maleWeight) maleHead.push(`Weight: ${data.maleWeight} kg`);
    if (data.maleBmi) maleHead.push(`BMI: ${data.maleBmi}`);
    if (maleHead.length > 0) sections.push(maleHead.join('\n'));

    const mSexual: string[] = ['MALE REPRODUCTIVE & SEXUAL HISTORY:'];
    mSexual.push(
      `• Problems with erection or ejaculation? ${data.maleErectileIssues || 'No'}`
    );
    mSexual.push(`• Frequency of intercourse per week: ${data.frequencyIntercourse || '2-3 times'}`);
    mSexual.push(`• Pain during sexual intercourse: ${data.maleDyspareunia || 'No'}`);
    mSexual.push(`• Last SI: ${data.maleLastSi || '—'}`);
    mSexual.push(`• Injuries in the groin/scrotum: ${data.maleScrotalInjury || 'No'}`);
    mSexual.push(`• Mumps in the past/as a child: ${data.maleMumps || 'No'}`);
    sections.push(mSexual.join('\n'));

    const mHabits: string[] = ['HABITS / LIFESTYLE (MALE):'];
    mHabits.push(`• Smoking: ${data.maleSmoking || 'No'}`);
    mHabits.push(`• Gutka: ${data.maleGutka || 'No'}`);
    mHabits.push(`• Alcohol: ${data.maleAlcohol || 'No'}`);
    mHabits.push(`• Toddy: ${data.maleToddy || 'No'}`);
    mHabits.push(`• Coffee: ${data.maleCoffee || 'None'}`);
    sections.push(mHabits.join('\n'));

    const mMed: string[] = ['PAST MEDICAL HISTORY (MALE):'];
    mMed.push(`• Hospital admissions: ${data.maleAdmissions || 'Nil'}`);
    mMed.push(`• Regular medication: ${data.maleRegularMed || 'None'}`);
    mMed.push(`• History of TB: ${data.maleTb || 'No'}`);
    mMed.push(`• Allergies: ${data.maleAllergies || 'NKDA'}`);
    sections.push(mMed.join('\n'));

    sections.push(`PAST SURGICAL HISTORY (MALE): ${data.malePastSurgical || 'Nil'}`);

    const mFam = Array.isArray(data.maleFamilyHistory)
      ? data.maleFamilyHistory.join(', ')
      : data.maleFamilyHistory;
    sections.push(`FAMILY HISTORY OF DM, HTN, CANCERS (MALE): ${mFam || 'Non-contributory'}`);

    const mExam: string[] = ['EXAMINATION (MALE):'];
    mExam.push(`O/E ${data.malePallor === 'Present' ? 'Pallor present' : 'No pallor'}`);
    mExam.push(
      `${data.malePedalEdema === 'Present' ? 'Pedal edema present' : 'No pedal edema'}`
    );
    mExam.push(`${data.maleGoitre === 'Present' ? 'Goitre present' : 'No goitre'}`);
    mExam.push(`BP: ${data.maleBp || '—'} mm Hg`);
    sections.push(mExam.join('\n'));
  }

  // 14. Fertility Investigations
  const invLines: string[] = ['FERTILITY INVESTIGATIONS:'];
  if (data.invAmh) invLines.push(`• AMH: ${data.invAmh}`);
  if (data.invFsh) invLines.push(`• FSH: ${data.invFsh}`);
  if (data.invLh) invLines.push(`• LH: ${data.invLh}`);
  if (data.invTsh) invLines.push(`• TSH: ${data.invTsh}`);
  if (data.invTubalPatency) invLines.push(`• Tubal patency: ${data.invTubalPatency}`);
  if (data.invHysteroLap) invLines.push(`• Hysteroscopy / Laparoscopy: ${data.invHysteroLap}`);
  if (data.invSemenAnalysis) invLines.push(`• Semen analysis: ${data.invSemenAnalysis}`);
  if (data.invDfi) invLines.push(`• Sperm DFI: ${data.invDfi}`);
  if (invLines.length > 1) sections.push(invLines.join('\n'));

  // 15. Fertility Treatments (Past)
  if (data.fertilityTreatments) {
    sections.push(`FERTILITY TREATMENTS:\n${data.fertilityTreatments}`);
  }

  // 16. Consultation Notes & Physical Examination (P/A, P/S, P/V, 3D Scan)
  const notesLines: string[] = ['CONSULTATION NOTES:'];
  if (data.fertilityCounselingDone) {
    notesLines.push(
      'Fertility explained including hormones, ovulation, tubal patency and semen: Yes'
    );
  }
  notesLines.push(`P/A - Soft: ${data.paFindings || 'Soft'}`);
  notesLines.push(`Scars: ${data.paScars || 'None'}`);

  const psLines: string[] = [];
  psLines.push(`P/S - Vulva Vagina: ${data.psVulvaVagina || 'Healthy'}`);
  psLines.push(
    `Cervix: ${data.psCervixHealthy !== false ? 'appears healthy' : 'abnormal appearance'}`
  );
  if (data.psCervixEctropion) psLines.push('Cervix ectropion noted');
  if (data.psCervicalSmearDone) psLines.push('Cervical smear done (LBC)');
  psLines.push(
    data.psBleedingOnTouch ? 'Bleeding on touch noted' : 'No bleeding noted on touch'
  );
  notesLines.push(psLines.join('. '));

  notesLines.push(
    `P/V - Uterus: ${data.pvUterusPosition || 'Anteverted'} | Size: ${
      data.pvUterusSize || 'Normal'
    } | ${data.pvUterusMobility || 'Mobile'}`
  );
  notesLines.push(`Fornices: Tenderness: ${data.pvFornicesTenderness || 'Absent'}`);

  if (data.threeDScan) {
    notesLines.push(`3-D Scan Findings:\n${data.threeDScan}`);
  }
  if (data.factorsInFavour) {
    notesLines.push(`Factors in favour:\n${data.factorsInFavour}`);
  }
  if (data.factorsNotInFavour) {
    notesLines.push(`Factors not in favour:\n${data.factorsNotInFavour}`);
  }
  sections.push(notesLines.join('\n'));

  // 17. Recommended Basic Investigations
  const recLines: string[] = ['RECOMMENDED BASIC INVESTIGATIONS:'];
  if (data.recommendedWifeTests?.length) {
    recLines.push(`Wife - ${data.recommendedWifeTests.join(', ')}`);
  }
  if (data.recommendedHusbandTests?.length) {
    recLines.push(`Husband - ${data.recommendedHusbandTests.join(', ')}`);
  }
  if (data.recSemenAnalysis) {
    recLines.push(
      'Semen analysis (Attend with 3 to 7 days abstinence, BY APPOINTMENT ONLY) Between 9 AM TO 11 AM'
    );
  }
  if (data.recDfi) {
    recLines.push(
      'Sperm DNA Fragmentation DFI (Attend with 2 days abstinence, BY APPOINTMENT ONLY) Between 9 AM TO 11 AM'
    );
  }

  const hasPending =
    data.pendingHusbandTests?.length > 0 || data.pendingWifeTests?.length > 0;
  if (hasPending) {
    recLines.push('Pending:');
    if (data.pendingHusbandTests?.length) {
      recLines.push(`• Husband - ${data.pendingHusbandTests.join(', ')}`);
    }
    if (data.pendingWifeTests?.length) {
      recLines.push(`• Wife - ${data.pendingWifeTests.join(', ')}`);
    }
  }
  if (recLines.length > 1) sections.push(recLines.join('\n'));

  // 18. Advised
  const advLines: string[] = ['ADVISED:'];
  if (data.fertilityFoods?.length) {
    advLines.push(`Fertility foods - ${data.fertilityFoods.join(', ')}`);
  }
  if (data.fertilitySupplements) {
    advLines.push(`Fertility Supplements: ${data.fertilitySupplements}`);
  }
  if (data.followUpPlan) {
    advLines.push(`Review Plan: ${data.followUpPlan}`);
  }
  if (advLines.length > 1) sections.push(advLines.join('\n'));

  // 19. Provisional Diagnosis
  if (data.finalDiagnosis) {
    sections.push(`Provisional Diagnosis:\n${data.finalDiagnosis}`);
  }

  // 20. Signature
  sections.push(
    `Consultant’s Name: ${data.seenByDr || 'Treating Consultant'}\nSignature: _______________________`
  );

  return sections.join('\n\n');
}
