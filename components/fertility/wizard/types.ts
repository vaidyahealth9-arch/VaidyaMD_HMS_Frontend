export interface TreatmentTypeItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
}

export const DEFAULT_TREATMENT_TYPES: TreatmentTypeItem[] = [
  { id: 'ICSI', name: 'ICSI', code: 'ICSI', category: 'ART', description: 'Intracytoplasmic Sperm Injection' },
  { id: 'IVF', name: 'Conventional IVF', code: 'IVF', category: 'ART', description: 'In Vitro Fertilization' },
  { id: 'ICSI_FET', name: 'ICSI + Freeze-All + FET', code: 'ICSI_FET', category: 'ART', description: 'Oocyte retrieval, ICSI, cryopreservation followed by FET' },
  { id: 'FET', name: 'Frozen Embryo Transfer (FET)', code: 'FET', category: 'Embryo Transfer', description: 'Thaw and transfer of vitrified embryo' },
  { id: 'IUI_H', name: 'IUI – Husband (IUI-H)', code: 'IUI_H', category: 'IUI', description: 'Intrauterine insemination with partner semen' },
  { id: 'IUI_D', name: 'IUI – Donor (IUI-D)', code: 'IUI_D', category: 'IUI', description: 'Intrauterine insemination with donor semen' },
  { id: 'OI_TI', name: 'OI + Timed Intercourse (TI)', code: 'OI_TI', category: 'Ovulation Induction', description: 'Folliculometry tracking with timed natural coitus' },
  { id: 'EGG_FREEZING', name: 'Social / Medical Oocyte Freezing', code: 'EGG_FREEZING', category: 'Cryopreservation', description: 'Oocyte retrieval and vitrification for fertility preservation' },
  { id: 'SPERM_FREEZING', name: 'Sperm Cryopreservation', code: 'SPERM_FREEZING', category: 'Cryopreservation', description: 'Semen freezing / surgical sperm banking' },
  { id: 'SURROGACY', name: 'Surrogacy ART Cycle', code: 'SURROGACY', category: 'Third-Party ART', description: 'Surrogacy ART treatment protocol' },
  { id: 'DONOR_EGG_IVF', name: 'Donor Oocyte IVF / ICSI', code: 'DONOR_EGG_IVF', category: 'Third-Party ART', description: 'IVF/ICSI using donor oocytes' },
  { id: 'PGT_CYCLE', name: 'ICSI + PGT-A / PGT-M', code: 'PGT_CYCLE', category: 'Advanced ART', description: 'Embryo biopsy for genetic screening prior to transfer' },
];

export interface EndometrialMonitoringRow {
  date: string;
  day_of_cycle: number;
  thickness_mm: number;
  pattern: string;
  vascularity: string;
}

export interface CycleFormState {
  treatment_type: string;
  attempt_number: number;
  treating_doctor_id: string;
  female_factors: string[];
  male_factors: string[];
  treatment_at_other_centre: boolean;
  previous_centre_name: string;
  protocol_template_id: string;
  sentinel_dates: {
    lmp_day1?: string;
    baseline_scan?: string;
    stim_start?: string;
    trigger?: string;
    opu?: string;
    et?: string;
    d12_scan?: string;
    p0_date?: string;
    p0_time?: string;
    embryo_stage?: string;
    planned_estrogen_days?: number;
    beta_hcg_date?: string;
    is_hrt_fet?: boolean;
    [key: string]: any;
  };
  gametes_source: {
    oocyte: string;
    donor_oocyte_id: string;
    sperm: string;
    donor_sperm_id: string;
  };
  pgs_pgd_data: {
    indicated: boolean;
    type: string;
    lab_name: string;
    biopsy_day: string;
  };
  endometrial_monitoring: EndometrialMonitoringRow[];
  remarks: string;
}

export interface CycleMeta {
  isFet: boolean;
  isIui: boolean;
  isEggFreezing: boolean;
  isPgt: boolean;
  isSurrogacy: boolean;
  isDonorEgg: boolean;
  isDonorSperm: boolean;
  isSurgicalSperm: boolean;
  hasOpu: boolean;
  hasEt: boolean;
  defaultProtocolCategory: string;
}

export interface TreatmentCycleWizardProps {
  patientId: string;
  partnerId?: string;
  patient?: any;
  partner?: any;
  onSuccess: (cycle: any) => void;
  onCancel: () => void;
  userId: string;
}

