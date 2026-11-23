import { ClinicalTemplateItem } from './TemplateManagementDialog';

export const CLINICAL_TEMPLATES: ClinicalTemplateItem[] = [
  {
    id: 'clinical_fertility_review',
    name: 'Fertility Review Template (Couple)',
    complaint: 'Fertility Review & Couple Evaluation.',
    hopi: '[Fertility Review & Progress Analysis]\\nFemale Partner:\\n- Cycle pattern / Last menstrual period: \\n- Follicular tracking & ovulation response: \\n- Prior interventions & findings: \\n\\nMale Partner:\\n- Semen analysis parameters review: \\n- Lifestyle, medical & surgical history: \\n- Ongoing andrology supplements: ',
    past_history: 'Previous obstetric history, medical illnesses, abdominal/pelvic surgeries, drug allergies.',
    examination: 'General: Temp: 98.4 F | PR: 76 bpm | BP: 120/80 mmHg | BMI: \\nTVS Pelvic Ultrasound Findings:\\n- Uterus: Normal size & contour, anteverted\\n- Endometrium:    mm, regular pattern\\n- Right Ovary: AFC:   follicles, volume:   cc\\n- Left Ovary: AFC:   follicles, volume:   cc\\n- POD: Clear',
    diagnosis: 'Primary / Secondary Subfertility — Couple Workup & Review',
    investigations: '',
    female_investigations: '',
    male_investigations: '',
    plan: '1. Review female and male investigation results\\n2. Plan clinical protocol (Timed Intercourse / OI / IUI / IVF-ICSI)\\n3. Couple counselling and pre-conceptional supplements prescribed',
  },
  {
    id: 'clinical_ot_discharge',
    name: 'Operative & Daycare Discharge Summary',
    complaint: 'Admitted for elective operative / daycare surgical procedure.',
    hopi: 'Seen by Dr: \\nStaff in attendance: \\nOperation: \\nReason for operation: \\nDate and Time of Admission: \\nDate and Time of Operation: \\nDate and Time of Discharge: \\nChief Complaints: \\nMenstrual History: \\nObstetric History: \\nPersonal History: \\nPast History: \\nFamily History: ',
    past_history: 'Previous hospitalizations, surgical history, known co-morbidities, drug allergies.',
    examination: 'Temp: \\nPR: \\nBP: \\nSpO2: \\nPA: ',
    diagnosis: 'Provisional Diagnosis: \\nFinal Diagnosis: ',
    investigations: 'Pre-operative investigations, CBC, Blood Group, Viral Markers, Coagulation Screen, Pelvic Ultrasound.',
    plan: '*******OPERATION NOTES HERE************\\n\\nTreatment at discharge: \\n\\nCondition at discharge: \\nPR:      BP:      SpO2:      Temp:      Alert and active\\n\\nAdvice on Discharge: \\nIn case of any emergency e.g. Abdominal pain, Heavy bleeding per vagina please contact hospital immediately on ___________________.\\n\\nFinal Diagnosis: \\nName and Signature of the patient: \\nSignature of Doctor: \\nName: \\nQualifications: \\nRegistration No.: ',
  },
  {
    id: 'clinical_opu_procedure',
    name: 'Oocyte Retrieval (OPU) Operative Note & Post-Op',
    complaint: 'Daycare admission for Oocyte Pick-Up (OPU) under anesthesia.',
    hopi: 'Oocyte Retrieval done today\\nPre-Op Antibiotics Monocef 1 Gram IV\\nIntravenous Anaesthesia/LMA\\nAfter anaesthesia, patient positioned in lithotomy\\nVagina and labia cleaned with normal saline as antiseptics are not allowed in IVF\\nDraped with ETO sterilised disposable drapes\\nStrict Aseptic precautions\\nTransvaginal Ultrasound probe\\nSterile disposable probe cover with normal saline\\nSterile probe guide attached to the probe\\nScan done\\nEndometrium and both ovaries checked\\nProceeded with oocyte retreival with 17G disposable needle\\nAccess to ovaries through vaginal fornices\\nOocytes retrieved - \\nP/S - Vulva, Vagina, Cervix appear healthy\\nP/S - Vulva, Vagina, Cervix - Ectropion noted\\nFree fluid ..........\\nEasy procedure / Difficult procedure\\nMobile Ovary\\nTranscervical approach / Transuterine approach\\nProcedure completed\\nPuncture sited checked and ensure haemostasis\\nEstimated blood loss: \\nSwabs and Instruments count: Correct\\nFreeze All / Fresh Transfer - Commence Dubagest And Duphaston Today\\nCouple Informed of findings',
    past_history: 'Stimulation protocol: Antagonist / PPOS / Agonist. Baseline AMH & AFC noted.',
    examination: 'Post-OPU Check: BP: 110/70 mmHg | PR: 76 bpm | SpO2: 99% | P/A: Soft, non-distended | P/V: Haemostasis secured, minimal spotting.',
    diagnosis: 'Controlled Ovarian Stimulation — Status Post Oocyte Retrieval (OPU Daycare)',
    investigations: 'Embryology report: Total Oocytes retrieved, Cumulus complex grading, MII/MI/GV maturity, Semen prep parameters.',
    plan: 'Advised:\\n1. Tab Dolo 650 Mg Three times a day x 3 days (10)\\n2. Tab Meprate 10 mg - 9 am - 9 pm x 10 days (20)\\n3. Can shower everyday\\n4. Abstinence for 1 week\\n5. Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge\\n6. Medication - Husband to stop based on embryology report\\n7. Next appointment:\\n- Fresh embryo transfer on: \\n- Freeze all - Collect Embryology report on: \\n- Baseline Scan for FET on Day 1-2 of next period',
  },
  {
    id: 'clinical_hysteroscopy_laparoscopy',
    name: 'Operation - Hysteroscopy + Laparoscopy',
    complaint: 'Diagnostic & Operative Hysteroscopy with Laparoscopy.',
    hopi: 'Operation - Hysteroscopy + Laparoscopy\\nGynaecologist - \\nAssistant - \\nAnaesthetist - \\nOTA - \\nRunners: \\nAnaesthesia - LMA/GA\\nIV antibiotics Monocef 1 gm given pre-op\\nAfter anaesthesia, patient positioned in lithotomy\\nVagina and labia cleaned with betadine\\nDraped with ETO sterilised disposable drapes\\nStrict Aseptic precautions\\n\\nFindings:\\nSpeculum - Cervix, vulva and vagina appear healthy\\n\\nHYSTEROSCOPY:\\nHysteroscopy performed with normal saline to distend cavity.\\nCavity appears regular\\nEndometrium appears healthy - Endometrium shows increased vascularity - Strawberry appearances\\nBoth ostia seen\\nNo polyps or fibroids noted.\\n\\nSEPTUM:\\nSeptum noted at the fundus, 1 cm deep\\nSeptum resected using bipolar needle, L hook\\nCavity appears normal after septum resection\\n\\nSCARRING:\\nScarring noted at the \\nDissected with bipolar needle\\nCavity appears normal after scar division\\n\\nADHESIONS:\\nAdhesions noted at the \\nDissected with bipolar needle\\nCavity appears normal after adhesiolysis\\n\\nPOLYP:\\nPolyp noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)\\nResected with bipolar needle cutting through the base.\\nCavity appears normal after polypectomy\\n\\nSUBMUCOUS FIBROID:\\nSubmucous fibroid noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)\\nResected with bipolar needle cutting through the base.\\nBase resected with Collin/s knife and specimen retrieved\\nFibroid resected with bipolar resectoscope\\nD&C - Endometrial curettage done and send for HPE\\nCavity appears normal after fibroid resection\\n\\nLAPAROSCOPY:\\n3 port laparoscopy. Central post 1.5 inches above the umbilicus. Direct entry.\\nPneumoperitoneum with CO2 up to 12 mm Hg.\\nAdditional two 5 mm ports in left iliac fossa and above. Good view obtained.\\nUterus - Normal appearance\\nRight ovary - Mobile and appears normal\\nRight tube - Mobile & appears healthy. Fill and spill +\\nTubo-ovarian relation maintained\\nLeft ovary - Mobile and appears normal\\nLeft tube - Mobile & appears healthy. Fill and spill +\\nTubo-ovarian relation maintained\\nPOD, ovarian fossae & uterosacral ligaments inspected and all normal.\\nNo endometriosis seen. Haemostasis ensured.\\nSwabs and instruments counted and correct. EBL 20 ml.\\nPolysorb to rectus sheath 10 mm ports. Glue to the skin. Water proof dressings applied.\\n\\nLEOS: Both ovaries polycystic appearance. Ovarian drilling done with monopolar needle 4 seconds, 4 points in both ovaries.\\nENDOMETRIOMA: Endometrioma noted in right/left ovary measuring ... Adhesions noted. Cyst opened, chocolate material drained, capsule excised in toto. Haemostasis ensured. Specimen sent for HPE.\\nSALPINGECTOMY: Bilateral / Right / Left salpingectomy done using vessel sealer and bipolar energy. Specimen sent for HPE.\\nOVARIAN CYST: Removed intact and sent for HPE biopsy.\\nECTOPIC: Ectopic pregnancy in right/left tube. Salpingectomy done using bipolar energy with vessel sealer.',
    past_history: 'Infertility duration, prior pelvic infections, past HSG/SSG findings.',
    examination: 'Post-op Vitals: BP: 120/80 mmHg | PR: 78 bpm | SpO2: 99% | Ports: Dry and clean | P/A: Soft.',
    diagnosis: 'Post Operative Hysteroscopy + Laparoscopy (Pelvic Endoscopy)',
    investigations: 'HPE of resected tissue / curettings / cyst wall specimen.',
    plan: 'POST-OP ORDERS & MEDICATION:\\n1. Tab Maxmentin 625 three times a day, after food x 5 days (15)\\n2. Tab Augxetil three times a day, after food x 5 days (15)\\n3. Tab Dox-T 100 mg Two times a day, after food x 14 days (28)\\n4. Tab Clindamycin 300 mg Two times a day, after food x 14 days (28)\\n5. Tab Acenakplus three times a day, after food x 3 days (9)\\n6. Tab Razole DSR Two times a day, before food x 5 days (10)\\n7. Tab Chymoral Forte three times a day, after food x 5 days (15)\\n8. Tab Novelon daily night at 9 PM (21 days / 42 days)\\n\\nAdvice:\\n- Can shower everyday\\n- Abstinence for 1 week / 3 weeks / 6 weeks\\n- Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge\\n- Follow up after 1 week on: \\n- 3D scan after 6 weeks on: \\n\\nDoctor Signature with stamp (Name and Regn Number)',
  },
  {
    id: 'clinical_hysteroscopy_plus',
    name: 'Operation - Hysteroscopy +',
    complaint: 'Elective Diagnostic & Operative Hysteroscopy.',
    hopi: 'Operation - Hysteroscopy +\\nGynaecologist: \\nAssistant: \\nAnaesthetist: \\nOTA: \\nRunners: \\nAnaesthesia - IV Anaesthesia/LMA/GA\\nPre-Op Antibiotics Monocef 1 Grams IV\\nAfter anaesthesia, patient positioned in lithotomy\\nVagina and labia cleaned with betadine\\nDraped with ETO sterilised disposable drapes\\nStrict Aseptic precautions\\n\\nFindings:\\nSpeculum - Cervix, vulva and vagina appear healthy\\n\\nHYSTEROSCOPY:\\nAseptic precautions. Saline hysteroscopy.\\nBoth ostia seen. No polyps or fibroids noted.\\n\\nSEPTUM:\\nSeptum noted at the fundus, 1 cm deep\\nSeptum resected using bipolar needle, L hook\\nCavity appears normal after septum resection\\n\\nSCARRING:\\nScarring noted at the \\nDissected with bipolar needle\\nCavity appears normal after scar division\\n\\nADHESIONS:\\nAdhesions noted at the \\nDissected with bipolar needle\\nCavity appears normal after adhesiolysis\\n\\nPOLYP:\\nPolyp noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)\\nResected with bipolar needle cutting through the base.\\nCavity appears normal after polypectomy\\n\\nSUBMUCOUS FIBROID:\\nSubmucous fibroid noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)\\nResected with bipolar needle cutting through the base.\\nBase resected with Collin/s knife and specimen retrieved\\nFibroid resected with bipolar resectoscope\\nD&C - Endometrial curettage done and send for HPE\\nCavity appears normal after fibroid resection\\n\\nProcedure:\\nPatient cleaned and draped. Hysteroscopy performed with normal saline to distend cavity. Findings as above. EBL -   ml. Swabs and instruments counted and correct.',
    past_history: 'Abnormal uterine bleeding, recurrent implantation failure, Asherman evaluation.',
    examination: 'Post-procedure: Alert and stable. Vitals normal. Minimal PV spotting.',
    diagnosis: 'Post Operative Hysteroscopy (Operative / Diagnostic)',
    investigations: 'HPE of curettage / excised polyp / tissue.',
    plan: 'POST-OP ORDERS & MEDICATION:\\n1. Tab Maxmentin 625 three times a day, after food x 5 days (15)\\n2. Tab Augxetil three times a day, after food x 5 days (15)\\n3. Tab Dox-T 100 mg Two times a day, after food x 14 days (28)\\n4. Tab Clindamycin 300 mg Two times a day, after food x 14 days (28)\\n5. Tab Acenakplus three times a day, after food x 3 days (9)\\n6. Tab Razole DSR Two times a day, before food x 5 days (10)\\n7. Tab Novelon daily night at 9 PM (21 days / 42 days)\\n\\nAdvice:\\n- Abstinence for 1 week / 3 weeks / 6 weeks\\n- Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge\\n- Follow up after 1 week on: \\n- 3D scan after 6 weeks on: ',
  },
  {
    id: 'clinical_fertility_proforma',
    name: 'Fertility Consultation Proforma (WHO/ART)',
    complaint: 'Fertility Consultation. Couple evaluation for planned conception.',
    hopi: '[Couple Fertility Consultation]\n- Duration trying for pregnancy: \n- Factors identified: \n- Menstrual cycle history: \n- Coital history: \n- Prior investigations & interventions: ',
    diagnosis: 'Primary / Secondary Infertility (Couple Workup)',
    investigations: 'Pelvic USG TVS, Serum AMH, Day 2/3 FSH/LH/E2, Semen Analysis (WHO 6th), Viral Markers (HIV, HBsAg, HCV)',
    plan: '1. Review baseline investigation reports\n2. Plan treatment protocol (OI / IUI / IVF-ICSI)\n3. Pre-ART statutory screening and counsel couple',
  },
  {
    id: 'clinical_follicular_scan',
    name: 'Ovulation Induction & Follicular Scan',
    complaint: 'Follow-up for follicle tracking / stimulation cycle.',
    hopi: 'Patient on ovarian stimulation cycle monitoring. Serial folliculometry tracking follicular development and endometrial lining.',
    diagnosis: 'Stimulated Ovulatory Cycle / Folliculometry',
    investigations: 'Serial Follicular Ultrasound (TVS), Serum E2/P4 if indicated',
    plan: '1. Continue ongoing stimulation protocol as directed\n2. Schedule repeat follicular tracking scan in 48 hours\n3. Timed intercourse instructions explained to couple',
  },
  {
    id: 'clinical_pcos_review',
    name: 'PCOS Metabolic & Lifestyle Review',
    complaint: 'Oligomenorrhea, weight gain, hirsutism, irregular menstrual cycles.',
    hopi: 'Irregular cycles with delayed periods. History of acne and difficulty managing weight. Evaluating metabolic and ovulatory status.',
    diagnosis: 'Polycystic Ovarian Syndrome (PCOS Phenotype)',
    investigations: 'Fasting Insulin, Fasting Glucose (HOMA-IR), Lipid Profile, Serum Total Testosterone, Pelvic USG TVS',
    plan: '1. Low glycemic index diet, regular aerobic exercise 45 mins/day\n2. Tab Myo-inositol + D-Chiro-Inositol 2g BD\n3. Tab Gluformin 500 SR (Metformin) OD post-dinner if insulin resistance confirmed\n4. Review after 6 weeks',
  },
  {
    id: 'clinical_anc_1st_tri',
    name: 'Antenatal Checkup (ANC) - 1st Trimester',
    complaint: 'Confirmed pregnancy (UPT +ve). Routine first trimester antenatal care.',
    hopi: 'Spontaneous / ART conception. Mild nausea, no spotting, no abnormal discharge, no abdominal cramps.',
    diagnosis: 'Intrauterine Gestation - 1st Trimester (Antenatal Care)',
    investigations: 'Dating / Viability USG, Complete Blood Count, Blood Group & Rh, Thyroid Profile (TSH), HbA1c, Rubella IgG, Double Marker (11-13 weeks)',
    plan: '1. Tab Folvite 5mg (Folic Acid) OD morning\n2. Tab Doxylamine + Pyridoxine SOS for nausea\n3. Balanced nutrition and hydration (>2.5L/day)\n4. Viability scan review at next visit',
  },
  {
    id: 'clinical_general_opd',
    name: 'General OPD / Medical Review',
    complaint: 'General health checkup / symptomatic evaluation.',
    hopi: 'Patient presenting for routine outpatient clinical evaluation and supportive management.',
    diagnosis: 'General Clinical Review',
    investigations: 'Complete Blood Count (CBC), Urine Routine & Microscopy',
    plan: '1. Symptomatic medical management\n2. Adequate hydration and balanced nutrition\n3. Review SOS or in 1 week if symptoms persist',
  },
];

export interface RxTemplate {
  id: string;
  name: string;
  category: string;
  medications: Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration?: string;
    instructions: string;
  }>;
  advice?: string;
}

export const COMMON_INVESTIGATION_OPTIONS = [
  'Pelvic TVS Scan',
  'Serum AMH',
  'Day 2/3 FSH & LH',
  'Serum Estradiol (E2)',
  'Serum Progesterone (P4)',
  'Serum Prolactin',
  'Thyroid (TSH)',
  'Semen Analysis (WHO 6th)',
  'CASA Semen Analysis',
  'Sperm DFI',
  'Viral Markers (HIV, HBsAg, HCV)',
  'Complete Blood Picture (CBP)',
  'Blood Group & Rh',
  'HbA1c',
  'Tubal Patency (HSG)',
  'Diagnostic Hysteroscopy',
  'Karyotyping (Couple)',
];

export const RX_TEMPLATES: RxTemplate[] = [
  {
    id: 'rx_opu_discharge',
    name: 'OPU Post-Egg Retrieval Discharge Rx',
    category: 'Post-OPU / Daycare',
    medications: [
      {
        drug_name: 'Tab Dolo 650 (Paracetamol)',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '3 days',
        instructions: 'Three times a day after meals x 3 days (Total: 10 tabs)',
      },
      {
        drug_name: 'Tab Meprate 10mg (Medroxyprogesterone Acetate)',
        dose: '10mg',
        frequency: 'BD',
        duration: '10 days',
        instructions: '9 AM - 9 PM after food x 10 days (Total: 20 tabs)',
      },
    ],
    advice: 'Can shower everyday. Strict abstinence for 1 week. Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge. Husband medication to stop based on embryology report. Report for next appointment / scan as scheduled.',
  },
  {
    id: 'rx_hysteroscopy_laparoscopy_postop',
    name: 'Hysteroscopy + Laparoscopy Comprehensive Post-Op Rx',
    category: 'OT Endoscopy Post-Op',
    medications: [
      {
        drug_name: 'Tab Maxmentin 625 (Amoxicillin + Clavulanic Acid)',
        dose: '625mg',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Three times a day after food x 5 days (15 tabs)',
      },
      {
        drug_name: 'Tab Augxetil (Cefuroxime Axetil)',
        dose: '500mg',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Three times a day after food x 5 days (15 tabs)',
      },
      {
        drug_name: 'Tab Dox-T 100mg (Doxycycline)',
        dose: '100mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Two times a day after food x 14 days (28 tabs)',
      },
      {
        drug_name: 'Tab Clindamycin 300mg',
        dose: '300mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Two times a day after food x 14 days (28 tabs)',
      },
      {
        drug_name: 'Tab Acenakplus (Aceclofenac + Paracetamol)',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '3 days',
        instructions: 'Three times a day after food x 3 days (9 tabs)',
      },
      {
        drug_name: 'Tab Razole DSR (Rabeprazole + Domperidone)',
        dose: '1 cap',
        frequency: 'BD',
        duration: '5 days',
        instructions: 'Two times a day before food x 5 days (10 caps)',
      },
      {
        drug_name: 'Tab Chymoral Forte',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Three times a day 30 mins before food x 5 days (15 tabs)',
      },
      {
        drug_name: 'Tab Novelon (Desogestrel + Ethinylestradiol)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '21 days',
        instructions: 'Daily night at 9:00 PM for 21 days (or 42 days as indicated)',
      },
    ],
    advice: 'Can shower everyday. Abstinence for 1 to 6 weeks as advised. Inform nurses immediately if fever, vomits, or severe pain. Follow up after 1 week; 3D scan scheduled after 6 weeks.',
  },
  {
    id: 'rx_hysteroscopy_postop',
    name: 'Hysteroscopy + Post-Op Medication Protocol',
    category: 'OT Endoscopy Post-Op',
    medications: [
      {
        drug_name: 'Tab Maxmentin 625',
        dose: '625mg',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Three times a day after food x 5 days (15 tabs)',
      },
      {
        drug_name: 'Tab Augxetil',
        dose: '500mg',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Three times a day after food x 5 days (15 tabs)',
      },
      {
        drug_name: 'Tab Dox-T 100mg',
        dose: '100mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Two times a day after food x 14 days (28 tabs)',
      },
      {
        drug_name: 'Tab Clindamycin 300mg',
        dose: '300mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Two times a day after food x 14 days (28 tabs)',
      },
      {
        drug_name: 'Tab Acenakplus',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '3 days',
        instructions: 'Three times a day after food x 3 days (9 tabs)',
      },
      {
        drug_name: 'Tab Razole DSR',
        dose: '1 cap',
        frequency: 'BD',
        duration: '5 days',
        instructions: 'Two times a day before food x 5 days (10 caps)',
      },
      {
        drug_name: 'Tab Novelon',
        dose: '1 tab',
        frequency: 'OD',
        duration: '21 days',
        instructions: 'Daily night at 9:00 PM for 21 days (or 42 days)',
      },
    ],
    advice: 'Abstinence for 1 to 3 weeks. Inform nurses if fever or severe pain occurs. Follow up visit after 1 week. 3D pelvic ultrasound scan after 6 weeks.',
  },
  {
    id: 'rx_antagonist_stim',
    name: 'Antagonist Protocol Daily Stimulation Rx',
    category: 'IVF Stimulation',
    medications: [
      {
        drug_name: 'Inj Recombinant FSH (Gonal-F / Follisurge) 225 IU',
        dose: '225 IU',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Subcutaneous injection daily at 8:00 PM (Days 2 to 6)',
      },
      {
        drug_name: 'Inj HMG (Menopur) 75 IU',
        dose: '75 IU',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Subcutaneous / IM injection daily at 8:00 PM (From Day 6 onward)',
      },
      {
        drug_name: 'Inj GnRH Antagonist (Cetrotide) 0.25mg',
        dose: '0.25mg',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Subcutaneous injection daily at 8:00 AM (From Day 6 until trigger)',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Morning after breakfast',
      },
    ],
    advice: 'Report on Day 6 for TVS follicular tracking scan and Serum E2/P4 levels. Maintain adequate hydration (>2.5 L/day).',
  },
  {
    id: 'rx_ppos_stim',
    name: 'PPOS Protocol Daily Rx (Progestin Primed)',
    category: 'IVF Stimulation',
    medications: [
      {
        drug_name: 'Inj Recombinant FSH (Follisurge) 225 IU',
        dose: '225 IU',
        frequency: 'OD',
        duration: '10 days',
        instructions: 'SC daily at 8:00 PM from Day 2 until trigger',
      },
      {
        drug_name: 'Tab Meprate 10mg (Medroxyprogesterone Acetate)',
        dose: '10mg',
        frequency: 'OD',
        duration: '10 days',
        instructions: 'Oral once daily with meals starting Day 2 until trigger day',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Morning after breakfast',
      },
    ],
    advice: 'Serial follicular scans starting Day 6. Freeze-all cycle planned; embryo transfer in subsequent HRT cycle.',
  },
  {
    id: 'rx_hrt_fet',
    name: 'HRT-FET Preparation Protocol Rx (Endometrial Priming)',
    category: 'FET Preparation',
    medications: [
      {
        drug_name: 'Tab Evatone 2mg (Estradiol Valerate)',
        dose: '2mg',
        frequency: 'TDS',
        duration: '14 days',
        instructions: 'Take after meals at 8 AM, 2 PM, 8 PM',
      },
      {
        drug_name: 'Tab Ecosprin 75mg (Aspirin)',
        dose: '75mg',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Take after lunch',
      },
      {
        drug_name: 'Cap Susten 400mg (Micronized Natural Progesterone)',
        dose: '400mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Vaginal insertion upon confirmed endometrial thickness >= 8mm (P0 date)',
      },
      {
        drug_name: 'Tab Duphaston 10mg (Dydrogesterone)',
        dose: '10mg',
        frequency: 'BD',
        duration: '14 days',
        instructions: 'Oral luteal booster; take after food',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Morning after breakfast',
      },
    ],
    advice: 'Report on Day 12 of estrogen for endometrial Doppler ultrasound. Initiate progesterone strictly as per P0 instructions.',
  },
  {
    id: 'rx_iui_letrozole',
    name: 'IUI / Timed Intercourse Ovulation Induction Rx',
    category: 'IUI / OI',
    medications: [
      {
        drug_name: 'Tab Letroz 2.5mg (Letrozole)',
        dose: '2.5mg',
        frequency: 'BD',
        duration: '5 days',
        instructions: 'Take from Cycle Day 2 to Day 6 after meals',
      },
      {
        drug_name: 'Tab Fertyl 50mg (Clomiphene Citrate)',
        dose: '50mg',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Take from Cycle Day 2 to Day 6',
      },
      {
        drug_name: 'Tab Fertisure F',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Post-lunch with water for egg quality',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Daily morning after breakfast',
      },
    ],
    advice: 'Come for Day 9 / Day 10 TVS follicular scan. Trigger injection will be scheduled when lead follicle reaches >= 18mm.',
  },
  {
    id: 'rx_post_fet_luteal',
    name: 'Post-FET / Post-IUI Comprehensive Luteal Phase Support',
    category: 'FET Luteal Support',
    medications: [
      {
        drug_name: 'Cap Susten 400mg (Micronized Natural Progesterone)',
        dose: '400mg',
        frequency: 'BD',
        duration: '15 days',
        instructions: 'Vaginal insertion twice daily (morning & bedtime)',
      },
      {
        drug_name: 'Tab Duphaston 10mg (Dydrogesterone)',
        dose: '1 tab',
        frequency: 'BD',
        duration: '15 days',
        instructions: 'Oral twice daily after meals',
      },
      {
        drug_name: 'Tab Evatone 2mg (Estradiol Valerate)',
        dose: '2mg',
        frequency: 'BD',
        duration: '15 days',
        instructions: 'Oral twice daily after meals',
      },
      {
        drug_name: 'Inj Clexane 40mg (Enoxaparin Sodium)',
        dose: '40mg',
        frequency: 'OD',
        duration: '15 days',
        instructions: 'Subcutaneous injection once daily post-dinner',
      },
      {
        drug_name: 'Tab Ecosprin 75mg (Aspirin)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '15 days',
        instructions: 'Oral once daily after lunch',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Oral once daily morning',
      },
    ],
    advice: 'Strict adherence to medications. Serum Beta-hCG blood test on Day 14 post-embryo transfer. Contact clinic immediately if vaginal bleeding occurs.',
  },
  {
    id: 'rx_pcos_metabolic',
    name: 'PCOS Insulin Sensitization & Cycle Regularization',
    category: 'PCOS & Ovulation',
    medications: [
      {
        drug_name: 'Tab Diane 35 (Cyproterone + Ethinylestradiol)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '21 days',
        instructions: 'Take 1 tab daily starting Day 1 or 2 of menses for 21 days',
      },
      {
        drug_name: 'Tab Gluformin 500 SR (Metformin)',
        dose: '500mg',
        frequency: 'BD',
        duration: '60 days',
        instructions: 'Take with meals to minimize gastrointestinal discomfort',
      },
      {
        drug_name: 'Tab Fertisure F',
        dose: '1 tab',
        frequency: 'OD',
        duration: '60 days',
        instructions: 'Post-lunch with water for oocyte quality enhancement',
      },
      {
        drug_name: 'Tab Folvite 5mg (Folic Acid)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '60 days',
        instructions: 'Morning after breakfast',
      },
    ],
    advice: 'Low GI diet and 30-45 mins moderate exercise daily. Baseline lipid and HbA1c monitoring. Review after 2 months.',
  },
  {
    id: 'rx_male_antioxidant',
    name: 'Male Subfertility & Spermatogenesis Booster',
    category: 'Andrology / Male',
    medications: [
      {
        drug_name: 'Tab Nurokind LC (L-Carnitine + Mecobalamin + Folic Acid)',
        dose: '1 tab',
        frequency: 'BD',
        duration: '90 days',
        instructions: 'Twice daily after meals for 90 days',
      },
      {
        drug_name: 'Cap CoQ 100mg (Coenzyme Q10)',
        dose: '100mg',
        frequency: 'BD',
        duration: '90 days',
        instructions: 'Twice daily after meals with water',
      },
      {
        drug_name: 'Tab Evion LC (Levocarnitine + Vitamin E)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '90 days',
        instructions: 'Once daily post-lunch',
      },
      {
        drug_name: 'Tab Fertyl 25mg (Clomiphene Citrate)',
        dose: '25mg',
        frequency: 'OD',
        duration: '60 days',
        instructions: 'Alternate days on Mon/Wed/Fri for 60 days',
      },
    ],
    advice: 'Avoid tight clothing, hot tubs, and laptop on lap. Repeat Semen Analysis (WHO 6th Ed) with CASA after 90 days.',
  },
  {
    id: 'rx_dub_menorrhagia',
    name: 'Dysfunctional Uterine Bleeding (DUB) / Menorrhagia Control',
    category: 'Gynaecology / Bleeding',
    medications: [
      {
        drug_name: 'Tab Trapic MF (Tranexamic Acid 500mg + Mefenamic Acid 250mg)',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Take during heavy flow days with meals',
      },
      {
        drug_name: 'Tab Regestrone 5mg (Norethisterone)',
        dose: '5mg',
        frequency: 'TDS',
        duration: '10 days',
        instructions: 'Take three times daily after food to arrest bleeding',
      },
      {
        drug_name: 'Tab Livogen Z (Iron + Folic Acid + Zinc)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '30 days',
        instructions: 'Take once daily after dinner to replenish iron reserves',
      },
      {
        drug_name: 'Cap Pan-D',
        dose: '1 cap',
        frequency: 'OD',
        duration: '7 days',
        instructions: 'Morning empty stomach 30 mins before breakfast',
      },
    ],
    advice: 'Monitor sanitary pad counts. Report immediately if dizziness or heavy clots persist. Repeat hemogram after bleeding stops.',
  },
  {
    id: 'rx_opu_recovery',
    name: 'OPU Post-Egg Retrieval Recovery & OHSS Prophylaxis',
    category: 'Post-OPU / Daycare',
    medications: [
      {
        drug_name: 'Tab Caberlin 0.5mg (Cabergoline)',
        dose: '0.5mg',
        frequency: 'OD',
        duration: '8 days',
        instructions: 'At bedtime for 8 days to prevent OHSS',
      },
      {
        drug_name: 'Tab Augmentin 625 Duo',
        dose: '1 tab',
        frequency: 'BD',
        duration: '5 days',
        instructions: 'Twice daily after food for 5 days',
      },
      {
        drug_name: 'Tab Dolo 650 (Paracetamol)',
        dose: '1 tab',
        frequency: 'SOS',
        duration: '3 days',
        instructions: 'As needed for lower abdominal cramping (max 3/day)',
      },
      {
        drug_name: 'Tab Chymoral Forte',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '5 days',
        instructions: 'Take 30 mins before meals for pelvic edema relief',
      },
      {
        drug_name: 'Cap Pan-D',
        dose: '1 cap',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Morning before breakfast',
      },
    ],
    advice: 'High-protein diet (egg whites, paneer, protein shake) and electrolyte-rich fluids (coconut water, ORS) > 3L/day. Contact clinic if severe abdominal distension occurs.',
  },
  {
    id: 'rx_general_opd',
    name: 'General OPD / Acute Infection & Pain Relief',
    category: 'General OPD',
    medications: [
      {
        drug_name: 'Tab Augmentin 625 Duo (Amoxicillin + Clavulanic Acid)',
        dose: '1 tab',
        frequency: 'BD',
        duration: '5 days',
        instructions: 'Take after food',
      },
      {
        drug_name: 'Tab Dolo 650 (Paracetamol 650mg)',
        dose: '1 tab',
        frequency: 'TDS',
        duration: '3 days',
        instructions: 'For fever / body ache',
      },
      {
        drug_name: 'Cap Pan-D (Pantoprazole + Domperidone)',
        dose: '1 cap',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'Morning 30 mins before food',
      },
      {
        drug_name: 'Tab Levocet M (Levocetirizine 5mg + Montelukast 10mg)',
        dose: '1 tab',
        frequency: 'OD',
        duration: '5 days',
        instructions: 'At bedtime for allergy/cough/rhinitis',
      },
      {
        drug_name: 'Tab Cip-Zox (Chlorzoxazone + Paracetamol)',
        dose: '1 tab',
        frequency: 'BD',
        duration: '3 days',
        instructions: 'For muscle spasm and severe body pain',
      },
    ],
    advice: 'Complete antibiotic course. Stay well hydrated. Review in OPD if symptoms persist after 3 days.',
  },
];


/**
 * Safely extracts clinical template fields from database records regardless of schema variations
 */
export function extractClinicalTemplateData(t: any): ClinicalTemplateItem {
  const schema = t?.schema_json || {};

  let complaint = schema.complaint || schema.chief_complaints || schema.chief_complaint || '';
  let hopi = schema.hopi || schema.present_history || schema.history_of_illness || schema.hpi || '';
  let diagnosis = schema.diagnosis || schema.provisional_diagnosis || schema.assessment || '';
  let investigations = schema.investigations || schema.planned_investigations || schema.investigations_to_be_advised || '';
  let plan = schema.plan || schema.treatment_plan || schema.treatment_notes || schema.management_plan || '';
  let past_history = schema.past_history || schema.previous_history || '';
  let examination = schema.examination || schema.clinical_examination || '';
  let female_investigations = schema.female_investigations || '';
  let male_investigations = schema.male_investigations || '';

  // If schema is saved as an array of form builder fields
  if (Array.isArray(schema)) {
    for (const f of schema) {
      const fid = (f.id || '').toLowerCase();
      const flabel = (f.label || '').toLowerCase();
      const val = f.value || f.defaultValue || f.placeholder || '';
      if (!val) continue;

      if (!complaint && (fid.includes('complaint') || flabel.includes('complaint'))) {
        complaint = val;
      } else if (!hopi && (fid.includes('hopi') || fid.includes('history') || flabel.includes('history') || flabel.includes('hopi'))) {
        hopi = val;
      } else if (!diagnosis && (fid.includes('diag') || flabel.includes('diagnosis'))) {
        diagnosis = val;
      } else if (!investigations && (fid.includes('investig') || flabel.includes('investigation') || flabel.includes('test'))) {
        investigations = val;
      } else if (!plan && (fid.includes('plan') || fid.includes('treatment') || flabel.includes('plan') || flabel.includes('treatment'))) {
        plan = val;
      }
    }
  }

  return {
    id: t.id,
    name: t.title || 'Untitled Clinical Template',
    isCustom: true,
    complaint,
    hopi,
    diagnosis,
    investigations,
    plan,
    past_history,
    examination,
    female_investigations,
    male_investigations,
  };
}
