export interface DischargeTemplate {
  id: string;
  name: string;
  diagnosis: string;
  course: string;
  instructions: string;
  meds: Array<{
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
}

export const DISCHARGE_TEMPLATES: DischargeTemplate[] = [
  {
    id: 'ot_summary',
    name: 'Operative Discharge Summary',
    diagnosis: 'Elective Operative Procedure — Post-Op Daycare Discharge',
    course: `Seen by Dr: 
Staff in attendance: 
Operation: 
Reason for operation: 
Date and Time of Admission: 
Date and Time of Operation: 
Date and Time of Discharge: 
Chief Complaints: 
Menstrual History: 
Obstetric History: 
Personal History: 
Past History: 
Family History: 
Examination: Temp:    PR:    BP:    SpO2:    PA: 
Provisional Diagnosis: 
Investigations: 
*******OPERATION NOTES HERE************
Treatment at discharge: 
Condition at discharge: PR:    BP:    SpO2:    Temp:    Alert and active`,
    instructions: `Advice on Discharge: In case of any emergency e.g. Abdominal pain, Heavy bleeding per vagina please contact hospital immediately on ___________________. Final Diagnosis: `,
    meds: [
      { medicine_name: 'Tab. Paracetamol 650mg', frequency: 'TDS', duration: '3 days', instructions: 'After food for pain' },
    ],
  },
  {
    id: 'opu_discharge',
    name: 'Oocyte Retrieval (OPU) Daycare Discharge',
    diagnosis: 'Controlled Ovarian Stimulation — Status Post Oocyte Pick-Up (OPU)',
    course: `Oocyte Retrieval done today. Pre-Op Antibiotics Monocef 1 Gram IV given. Intravenous Anaesthesia/LMA. Patient in lithotomy position. Vagina and labia cleaned with normal saline as antiseptics are not allowed in IVF. Transvaginal Ultrasound probe with sterile disposable cover & guide. Scan done: endometrium & ovaries checked. Proceeded with oocyte retrieval using 17G disposable needle through vaginal fornices. P/S: Vulva, vagina, cervix appear healthy. Procedure completed without complication. Puncture sites checked and haemostasis ensured. Swabs and instruments count correct. Freeze-all / fresh transfer planned. Couple informed of gamete findings.`,
    instructions: `1. Can shower everyday.
2. Abstinence for 1 week.
3. Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge.
4. Husband medication to stop based on embryology report.
5. Next appointment: Fresh embryo transfer / Collect Embryology report / Baseline Scan for FET on Day 1-2 of next period.`,
    meds: [
      { medicine_name: 'Tab Dolo 650 Mg', dosage: '650mg', frequency: 'TDS', duration: '3 days', instructions: 'Three times a day after meals (Total: 10 tabs)' },
      { medicine_name: 'Tab Meprate 10 mg', dosage: '10mg', frequency: 'BD', duration: '10 days', instructions: '9 AM - 9 PM after food (Total: 20 tabs)' },
    ],
  },
  {
    id: 'hystero_lap_discharge',
    name: 'Hysteroscopy + Laparoscopy Discharge',
    diagnosis: 'Status Post Diagnostic & Operative Hysteroscopy + Laparoscopy',
    course: `Operation: Hysteroscopy + Laparoscopy under GA/LMA. Aseptic precautions. Normal saline cavity distension. Findings: Cervix healthy. Cavity regular, ostia visualised. Septum / polyps / adhesions managed with bipolar instrumentation. Laparoscopy 3-port: Uterus, bilateral ovaries and fallopian tubes evaluated. Haemostasis secured, swabs and instruments counted and correct. Port sites closed cleanly. Recovery smooth and uneventful.`,
    instructions: `1. Can shower everyday.
2. Abstinence for 1 week to 3 weeks as advised.
3. Inform nurses immediately if fever, vomitings, pain, or foul smelling discharge occurs.
4. Follow up visit after 1 week.
5. 3D ultrasound scan after 6 weeks.`,
    meds: [
      { medicine_name: 'Tab Maxmentin 625', dosage: '625mg', frequency: 'TDS', duration: '5 days', instructions: 'After food (15 tabs)' },
      { medicine_name: 'Tab Augxetil', dosage: '500mg', frequency: 'TDS', duration: '5 days', instructions: 'After food (15 tabs)' },
      { medicine_name: 'Tab Dox-T 100 mg', dosage: '100mg', frequency: 'BD', duration: '14 days', instructions: 'After food (28 tabs)' },
      { medicine_name: 'Tab Clindamycin 300 mg', dosage: '300mg', frequency: 'BD', duration: '14 days', instructions: 'After food (28 tabs)' },
      { medicine_name: 'Tab Acenakplus', dosage: '1 tab', frequency: 'TDS', duration: '3 days', instructions: 'After food for pain (9 tabs)' },
      { medicine_name: 'Tab Razole DSR', dosage: '1 cap', frequency: 'BD', duration: '5 days', instructions: 'Before food (10 caps)' },
      { medicine_name: 'Tab Novelon', dosage: '1 tab', frequency: 'OD', duration: '21 days', instructions: 'Daily night at 9 PM (21 days)' },
    ],
  },
];
