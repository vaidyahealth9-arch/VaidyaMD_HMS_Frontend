export type BedStatus = 'Vacant' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'available' | 'occupied' | 'maintenance' | 'reserved';
export type AdmissionStatus = 'Active' | 'Discharged' | 'Transferred' | 'admitted' | 'discharged' | 'transferred';
export type NursingTaskStatus = 'Pending' | 'Completed' | 'Cancelled' | 'pending' | 'completed' | 'cancelled';

export interface Ward {
  id: string;
  name: string;
  code: string;
  department?: string;
  base_charge_per_day: number;
  total_beds?: number;
  occupied_beds?: number;
  is_active?: boolean;
  branch_id?: string | null;
}

export interface Bed {
  id: string;
  ward_id: string;
  ward_name?: string;
  bed_number: string;
  bed_type?: string;
  daily_rate?: number;
  status: string;
  patient_id?: string;
  patient_name?: string;
  admission_id?: string;
  current_admission?: {
    admission_id: string;
    admission_number: string;
    patient_id: string;
    patient_name: string;
    patient_mrn: string;
    admitting_doctor: string;
    diagnosis?: string;
    admission_date: string;
    package_name?: string;
    total_accrued_amount?: number;
    allergies?: string[];
    risk_factors?: RiskFactors;
  };
}

export interface RiskFactors {
  fall_risk?: boolean;
  npo?: boolean;
  dvt_risk?: boolean;
  isolation?: boolean;
  pressure_ulcer_risk?: boolean;
}

export interface RoundNote {
  id: string;
  doctor_id?: string;
  doctor_name?: string;
  round_time: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  notes?: string;
  created_at: string;
}

export interface AdministeredLog {
  id: string;
  timestamp: string;
  status: 'Given' | 'Withheld' | 'Refused' | 'Omitted';
  nurse_name: string;
  nurse_id?: string;
  notes?: string;
}

export interface IPDOrder {
  id: string;
  order_type: 'Medication' | 'Investigation' | 'Diet' | 'Nursing Care' | string;
  item_name: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  administered_logs?: AdministeredLog[];
  ordered_by_name?: string;
  created_at: string;
}

export interface FluidBalance {
  id: string;
  record_date: string;
  shift: string;
  intake_oral: number;
  intake_iv: number;
  intake_other: number;
  total_intake: number;
  output_urine: number;
  output_drain: number;
  output_vomitus: number;
  output_other: number;
  total_output: number;
  net_balance: number;
  notes?: string;
  recorded_by_name?: string;
}

export interface DischargeSummary {
  discharge_type?: 'Normal' | 'LAMA' | 'Referred' | 'Deceased';
  condition_at_discharge?: 'Stable' | 'Critical' | 'Improved' | 'Cured';
  hospital_course?: string;
  discharge_diagnosis?: string;
  investigations_summary?: string;
  discharge_medications?: Array<{
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  dietary_advice?: string;
  follow_up_instructions?: string;
  follow_up_date?: string;
}

export interface AdmissionDetails {
  id: string;
  admission_number: string;
  status: string;
  patient: {
    id: string;
    name: string;
    vid: string;
    gender?: string;
    age?: number;
    phone?: string;
    alternate_phone?: string;
    blood_group?: string;
    photo_url?: string;
    partner?: {
      id: string;
      name: string;
      phone?: string;
      vid?: string;
    } | null;
  };
  bed: {
    id: string;
    bed_number: string;
    bed_type: string;
    daily_rate: number;
    ward_id: string;
    ward_name: string;
  };
  admitting_doctor: {
    id?: string;
    name: string;
    specialization?: string;
  };
  admission_date: string;
  duration_days: number;
  diagnosis?: string;
  package_name?: string;
  notes?: string;
  allergies: string[];
  risk_factors: RiskFactors;
  advance_amount: number;
  total_accrued_amount: number;
  credit_limit?: number;
  attending_doctor_charge_per_day?: number;
  discharge_summary?: DischargeSummary;
  round_notes: RoundNote[];
  orders: IPDOrder[];
  fluid_balances: FluidBalance[];
  nursing_tasks: NursingTask[];
}

export interface Admission {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_mrn?: string;
  bed_id: string;
  bed_number?: string;
  ward_name?: string;
  admitting_doctor_id?: string;
  admitting_doctor?: string;
  admission_date: string;
  discharge_date?: string;
  diagnosis?: string;
  package_name?: string;
  notes?: string;
  status: string;
  total_accrued_amount?: number;
  advance_amount?: number;
  allergies?: string[];
  risk_factors?: RiskFactors;
}

export interface VitalsPayload {
  bp_systolic?: number | string;
  bp_diastolic?: number | string;
  pulse?: number | string;
  temperature?: number | string;
  spo2?: number | string;
  respiratory_rate?: number | string;
  grbs?: number | string;
  pain_score?: number | string;
  recorded_at?: string;
  [key: string]: unknown;
}

export interface NursingTask {
  id: string;
  admission_id: string;
  bed_id: string;
  bed_number?: string;
  patient_name?: string;
  task_type: string;
  description: string;
  frequency?: string;
  scheduled_time?: string;
  status: NursingTaskStatus;
  completed_by_id?: string;
  completed_by_name?: string;
  completed_at?: string;
  vitals_payload?: VitalsPayload;
  notes?: string;
}


export interface BillItem {
  id: string;
  admission_id?: string;
  item_type: 'room_rent' | 'nursing_care' | 'doctor_consultation' | 'pharmacy_medication' | 'pharmacy_surgical' | 'lab_investigation' | 'radiology' | 'equipment' | 'diet' | 'procedure_ot' | 'miscellaneous' | string;
  category: string;
  service_code?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_automated?: boolean;
  is_billed?: boolean;
  status?: 'unbilled' | 'billed' | 'paid' | string;
  invoice_id?: string;
  billed_at?: string;
  billing_date?: string;
  source_module?: string;
  created_by_name?: string;
  notes?: string;
}

export interface IPDPayment {
  id: string;
  receipt_number: string;
  amount: number;
  payment_method: string;
  transaction_reference?: string;
  payment_date: string;
  payment_type: 'advance' | 'interim' | 'final' | 'refund' | string;
  invoice_id?: string;
  collected_by_name?: string;
  notes?: string;
}

export interface RollingBillSummary {
  admission_id: string;
  admission_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  bed_number: string;
  ward_name: string;
  admitting_doctor: string;
  admission_date?: string;
  total_gross: number;
  unbilled_total?: number;
  billed_total?: number;
  total_advance: number;
  net_due: number;
  credit_limit: number;
  is_credit_exceeded: boolean;
  category_breakdown: Record<string, number>;
  items: BillItem[];
  payments: IPDPayment[];
}

export interface BillItemPayload {
  item_type: string;
  category: string;
  service_code?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  billing_date?: string;
}

export interface PaymentPayload {
  amount: number;
  payment_method: string;
  transaction_reference?: string;
  payment_type: string;
  notes?: string;
}
