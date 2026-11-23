export interface OTTemplate {
  id: string;
  name: string;
  preOp: string;
  postOp: string;
  notes: string;
  orders: string;
}

export const OT_TEMPLATES: OTTemplate[] = [
  {
    id: 'opu',
    name: 'Oocyte Retrieval (OPU)',
    preOp: 'Primary / Secondary Infertility undergoing IVF/ICSI',
    postOp: 'Post Oocyte Retrieval (OPU Daycare)',
    notes: `Oocyte Retrieval done today
Pre-Op Antibiotics Monocef 1 Gram IV
Intravenous Anaesthesia/LMA
After anaesthesia, patient positioned in lithotomy 
Vagina and labia cleaned with normal saline as antiseptics are not allowed in IVF 
Draped with ETO sterilised disposable drapes 
Strict Aseptic precautions
Transvaginal Ultrasound probe
Sterile disposable probe cover with normal saline 
Sterile probe guide attached to the probe 
Scan done 
Endometrium and both ovaries checked
Proceeded with oocyte retreival with 17G disposable needle 
Access to ovaries through vaginal fornices
Oocytes retrieved - \t
P/S - Vulva, Vagina, Cervix appear healthy
P/S - Vulva, Vagina, Cervix - Ectropion noted 
Free fluid ..........
Easy procedure / Difficult procedure 
Mobile Ovary 
Transcervical approach / Transuterine approach  
Procedure completed
Puncture sited checked and ensure haemostasis
Estimated blood loss: 
Swabs and Instruments count: Correct  
Freeze All / Fresh Transfer - Commence Dubagest And Duphaston Today 
Couple Informed of findings`,
    orders: `1. Tab Dolo 650 Mg Three times a day x 3 days (10)
2. Tab Meprate 10 mg - 9 am - 9 pm x 10 days (20)
3. Can shower everyday 
4. Abstinence for 1 week
5. Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge 
6. Medication - Husband to stop based on embryology report 
7. Next appointment:
- Fresh embryo transfer on:
- Freeze all - Collect Embryology report on:
- Baseline Scan for FET on Day1-2 of next period`,
  },
  {
    id: 'hystero_lap',
    name: 'Hysteroscopy + Laparoscopy',
    preOp: 'Primary / Secondary Subfertility for Diagnostic & Operative Laparo-Hysteroscopy',
    postOp: 'Post Hysteroscopy + Laparoscopy (Operative Pelvic Endoscopy)',
    notes: `Operation - Hysteroscopy + Laparoscopy 
Gynaecologist - 
Assistant - 
Anaesthetist - 
OTA - 
Runners: 
Anaesthesia - LMA/GA
IV antibiotics Monocef 1 gm given pre-op
After anaesthesia, patient positioned in lithotomy 
Vagina and labia cleaned with betadine
Draped with ETO sterilised disposable drapes 
Strict Aseptic precautions
Findings
Speculum - Cervix, vulva and vagina appear healthy

HYSTEROSCOPY: 
Hysteroscopy performed with normal saline to distend cavity. 
Cavity appears regular
Endometrium appears healthy - Endometrium shows increased vascularity - Strawberry appearances  
Both ostia seen 
No polyps or fibroids noted. 

SEPTUM:
Septum noted at the fundus, 1 cm deep
Septum resected using bipolar needle, L hook
Cavity appears normal after septum resection

SCARRING:
Scarring noted at the 
Dissected with bipolar needle
Cavity appears normal after scar division 

ADHESIONS:
Adhesions noted at the 
Dissected with bipolar needle
Cavity appears normal after adhesiolysis

POLYP:
Polyp noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)
Resected with bipolar needle cutting through the base.
Cavity appears normal after polypectomy

SUBMUCOUS FIBROID:
Submucous fibroid noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)
Resected with bipolar needle cutting through the base.
Base resected with Collin/s knife and specimen retrieved
Fibroid resected with bipolar resectoscope
D&C - Endometrial curettage done and send for HPE
Cavity appears normal after fibroid resection

LAPAROSCOPY:
3 port laparoscopy. Central post 1.5 inches above the umbilicus. Direct entry.
Pneumoperitoneum with CO2 up to 12 mm Hg.
Additional two 5 mm ports in left iliac fossa and above. Good view obtained.
Uterus - Normal appearance
Right ovary - Mobile and appears normal
Right tube - Mobile & appears healthy. Fill and spill +
Tubo-ovarian relation maintained 
Left ovary - Mobile and appears normal
Left tube -Mobile & appears healthy. Fill and spill +
Tubo-ovarian relation maintained 
POD, ovarian fossae & uterosacral ligaments inspected and all normal. 
No endometriosis seen. 
Haemostasis ensured.
Swabs and instruments counted and correct. EBL 20 ml.
Polysorb to rectus sheath 10 mm ports. Glue to the skin. Water proof dressings applied.

LEOS: Both ovaries polycystic appearance. Ovarian drilling done with monopolar needle (4 seconds, 4 points in both ovaries).
ENDOMETRIOMA: Endometrioma noted in right/left ovary measuring ... Adhesions noted between endometrioma and ... Cyst opened using monopolar/bipolar needle. ... ml of chocolate material drained. Cyst capsule excised in toto. Haemostasis ensured. Specimen removed through 10mm port and sent for HPE.
SALPINGECTOMY: Bilateral / Right / Left salpingectomy done using vessel sealer and bipolar energy. Specimen removed and sent for HPE.
OVARIAN CYST: Removed intact and sent for HPE biopsy.
ECTOPIC: Ectopic pregnancy in right/left tube. Salpingectomy done using bipolar energy with vessel sealer.`,
    orders: `POST-OP MEDICATION:
1. Tab Maxmentin 625 three times a day, after food x 5 days (15) 
2. Tab Augxetil three times a day, after food x 5 days (15) 
3. Tab Dox-T 100 mg Two times a day, after food x 14 days (28) 
4. Tab Clindamycin 300 mg Two times a day, after food x 14 days (28) 
5. Tab Acenakplus three times a day, after food x 3 days (9)
6. Tab Razole DSR Two times a day, before food x 5 days (10) 
7. Tab Chymoral Forte three times a day, after food x 5 days (15) 
8. Tab Novelon daily night at 9 PM - 21 days (or 42 days)

ADVICE:
- Can shower everyday 
- Abstinence for 1 week / 3 weeks / 6 weeks 
- Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge 
- Follow up after 1 week on:
- 3D scan after 6 weeks on:`,
  },
  {
    id: 'hystero_plus',
    name: 'Hysteroscopy +',
    preOp: 'Abnormal Uterine Bleeding / Intrauterine Pathology',
    postOp: 'Post Diagnostic & Operative Hysteroscopy',
    notes: `Operation - Hysteroscopy + 
Gynaecologist: 
Assistant - 
Anaesthetist: 
OTA: 
Runners: 
Anaesthesia - IV Anaesthesia/LMA/GA
Pre-Op Antibiotics Monocef 1 Grams IV
After anaesthesia, patient positioned in lithotomy 
Vagina and labia cleaned with betadine
Draped with ETO sterilised disposable drapes 
Strict Aseptic precautions
Findings
Speculum - Cervix, vulva and vagina appear healthy

HYSTEROSCOPY: 
Aseptic precautions. Saline hysteroscopy.
Both ostia seen. No polyps or fibroids noted. 

SEPTUM:
Septum noted at the fundus, 1 cm deep
Septum resected using bipolar needle, L hook
Cavity appears normal after septum resection

SCARRING:
Scarring noted at the 
Dissected with bipolar needle
Cavity appears normal after scar division 

ADHESIONS:
Adhesions noted at the 
Dissected with bipolar needle
Cavity appears normal after adhesiolysis

POLYP:
Polyp noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)
Resected with bipolar needle cutting through the base.
Cavity appears normal after polypectomy

SUBMUCOUS FIBROID:
Submucous fibroid noted on the ………… uterine wall measuring ……….. (Sessile/Pedunculated)
Resected with bipolar needle cutting through the base.
Base resected with Collin/s knife and specimen retrieved
Fibroid resected with bipolar resectoscope
D&C - Endometrial curettage done and send for HPE
Cavity appears normal after fibroid resection

Procedure:
Patient cleaned and draped. Hysteroscopy performed with normal saline to distend cavity. Findings as above. EBL -  ml. Swabs and instruments counted and correct.`,
    orders: `POST-OP MEDICATION:
1. Tab Maxmentin 625 three times a day, after food x 5 days (15) 
2. Tab Augxetil three times a day, after food x 5 days (15) 
3. Tab Dox-T 100 mg Two times a day, after food x 14 days (28) 
4. Tab Clindamycin 300 mg Two times a day, after food x 14 days (28) 
5. Tab Acenakplus three times a day, after food x 3 days (9)
6. Tab Razole DSR Two times a day, before food x 5 days (10) 
7. Tab Novelon daily night at 9 PM - 21 days (or 42 days)

ADVICE:
- Abstinence for 1 week / 3 weeks / 6 weeks 
- Inform nurses on same day if fever, vomitings, loose motions, pain, foul smelling discharge 
- Follow up after 1 week on:
- 3D scan after 6 weeks on:`,
  },
  {
    id: 'ot_discharge_note',
    name: 'Operative Discharge Format',
    preOp: 'Elective OT Admission',
    postOp: 'Post Operative Daycare Discharge',
    notes: `Seen by Dr: 
Staff in attendance: 
Operation - 
Reason for operation - 
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
*******OPERATION NOTES HERE************`,
    orders: `Treatment at discharge: 
Condition at discharge: PR:    BP:    SpO2:    Temp:    Alert and active 
Advice on Discharge: In case of any emergency e.g. Abdominal pain, Heavy bleeding per vagina please contact hospital immediately on ___________________.
Final Diagnosis: 
Name and Signature of the patient: 
Signature of Doctor (Name, Qualifications, Regn No.):`,
  },
];
