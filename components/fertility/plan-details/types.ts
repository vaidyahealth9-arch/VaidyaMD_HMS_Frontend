/**
 * VaidyaMD HMS — Plan Details & Stimulation Suite Types
 * Visual reference matching Sparta Fertility HMS & clinical protocols
 */

export type PlanItemCategory = 'medication' | 'scan' | 'lab' | 'procedure';
export type PlanItemStatus = 'planned' | 'administered' | 'cancelled';
export type PlanItemPhase = 'stimulation' | 'luteal';
export type PlanViewMode = 'timeline_ledger' | 'calendar_7day';

export type CycleSubTab =
  | 'intended'
  | 'gametes'
  | 'pgs_pgd'
  | 'treatment_plan'
  | 'endometrial'
  | 'plan_details'
  | 'summary';

export interface PlanTimelineItem {
  id: string;
  day_number: number;
  date: string; // ISO YYYY-MM-DD
  display_date: string; // e.g. 11-Sep-2026
  day_of_week: string; // e.g. Fri
  stim_day_number: number; // e.g. 2
  phase?: PlanItemPhase; // 'stimulation' (Amber) | 'luteal' (Emerald)
  category: PlanItemCategory;
  name: string;
  dosage?: string;
  quantity?: number;
  dose_display?: string; // e.g. (1 X 175) IU
  frequency?: string;
  route?: string;
  status: PlanItemStatus;
  administered_at?: string;
  administered_by?: string;
  scan_details?: string; // e.g. ET - 2; R-10; L -4;
  endometrium_mm?: string;
  endometrial_pattern?: string;
  right_follicles?: string;
  left_follicles?: string;
  lab_result?: string;
  notes?: string;
}

export interface DayTimelineGroup {
  day_number: number;
  date: string;
  display_date: string;
  day_of_week: string;
  stim_day_number: number;
  milestone?: string;
  items: PlanTimelineItem[];
  right_follicles?: string;
  left_follicles?: string;
  endometrium_mm?: string;
  endometrial_pattern?: string;
  e2_pgml?: string;
  p4_ngml?: string;
  lh_miu?: string;
  notes?: string;
}

export interface FollicleToken {
  mm: number;
  category: 'mature' | 'intermediate' | 'small';
}

export interface FollicleCohortStats {
  hasData: boolean;
  dayNumber?: number;
  totalCount: number;
  matureCount: number; // >= 18mm
  intermediateCount: number; // 14-17mm
  smallCount: number; // < 14mm
  leadFollicle: number;
  triggerReady: boolean;
  peakE2: number;
  isHighOhssRisk: boolean;
  isModerateOhssRisk: boolean;
}

export interface TreatmentCycleRecord {
  id: string;
  cycle_id: string;
  patient_id: string;
  partner_id?: string;
  treating_doctor_id?: string;
  doctor_name?: string;
  treatment_type: string;
  status: 'planned' | 'running' | 'completed' | 'cancelled' | 'on_hold';
  attempt_number: number;
  start_date: string;
  end_date?: string;
  female_factors?: string[];
  male_factors?: string[];
  treatment_at_other_centre?: boolean;
  previous_centre_name?: string;
  sentinel_dates?: Record<string, any>;
  gametes_source?: Record<string, any>;
  pgs_pgd_data?: Record<string, any>;
  medication_calendar?: any[];
  endometrial_monitoring?: any[];
  et_discharge_summary?: Record<string, any>;
  remarks?: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  treating_doctor_name?: string;
  reason?: string;
}
