export type CosGynEquipment = 'Jet Plasma' | 'Tesla Chair' | 'PRP Therapy' | string;

export type CosGynSessionStatus = 'scheduled' | 'completed' | 'cancelled' | string;

export interface CosGynTreatment {
  id: string;
  name: string;
  description?: string;
  package_combo?: string;
  price: number;
  jet_plasma_sessions: number;
  jet_plasma_duration_mins: number;
  tesla_chair_sessions: number;
  tesla_chair_duration_mins: number;
  prp_sessions: number;
  active?: boolean;
}

export interface CosGynSession {
  id: string;
  plan_id?: string;
  patient_id: string;
  patient_name?: string;
  patient_mrn?: string;
  patient_vid?: string;
  equipment: CosGynEquipment;
  treatment_name?: string;
  session_number: number;
  scheduled_datetime: string;
  duration_mins: number;
  status: CosGynSessionStatus;
  notes?: string;
}

export interface CosGynPlan {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_mrn?: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  treatment_id?: string;
  treatment_name: string;
  total_amount?: number;
  paid_amount?: number;
  billed?: boolean | string;
  completed_sessions?: number;
  total_sessions?: number;
  sessions?: CosGynSession[];
  created_at?: string;
}
