/**
 * VaidyaMD HMS — Fertility Plugin Domain Types
 */

export type CycleStatus = 'planned' | 'running' | 'cancelled' | 'completed' | 'on_hold';

export interface TreatmentCycle {
  id: string;
  cycle_id: string;
  patient_id: string;
  partner_id?: string;
  treating_doctor_id: string;
  treatment_type: string;
  status: CycleStatus;
  attempt_number: number;
  start_date: string;
  end_date?: string;
  female_factors?: string[];
  male_factors?: string[];
  sentinel_dates?: Record<string, string>;
  medication_calendar?: any[];
  et_discharge_summary?: Record<string, any>;
  created_at: string;
}

export interface EmbryologyRecord {
  id: string;
  treatment_cycle_id: string;
  oocyte_number: number;
  procedure_type: string;
  maturity_day0: string;
  fert_check_day1?: string;
  day3_data?: Record<string, any>;
  day5_data?: Record<string, any>;
  disposition?: Record<string, any>;
}

export interface CryoSample {
  id: string;
  straw_number: string;
  tank_number: string;
  canister_number: string;
  sample_type: string;
  no_of_embryos: number;
  status: 'available' | 'warmed' | 'discarded' | 'transferred_out';
  freezing_datetime: string;
}
