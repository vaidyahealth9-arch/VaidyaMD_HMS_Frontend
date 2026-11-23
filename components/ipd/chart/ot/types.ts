export interface OTStaffSummary {
  id: string;
  name: string;
}

export interface GuestSurgeonRecord {
  name: string;
  role?: string;
  hospital?: string;
  fee: number;
}

export interface OTRecord {
  id: string;
  admission_id: string;
  patient_id: string;
  procedure_name: string;
  surgery_category: 'Major' | 'Minor' | 'Intermediate' | 'Daycare' | string;
  status: 'Scheduled' | 'Wheeled In' | 'In Progress' | 'Recovery' | 'Completed' | 'Cancelled' | string;
  wheel_in_time?: string | null;
  wheel_out_time?: string | null;
  total_ot_hours: number;
  primary_surgeon?: OTStaffSummary | null;
  assistant_surgeon?: OTStaffSummary | null;
  assistant_surgeon_name?: string | null;
  anesthetist?: OTStaffSummary | null;
  anesthetist_name?: string | null;
  scrub_nurse?: OTStaffSummary | null;
  circulating_nurse?: OTStaffSummary | null;
  guest_surgeons?: GuestSurgeonRecord[];
  anesthesia_type?: string;
  anesthesia_notes?: string;
  pre_op_diagnosis?: string;
  post_op_diagnosis?: string;
  operative_notes?: string;
  post_op_orders?: string;
  ot_hourly_rate: number;
  ot_room_charge: number;
  procedure_fee: number;
  surgeon_fee: number;
  anesthesia_fee: number;
  guest_surgeons_fee?: number;
  total_ot_charge: number;
  is_billed: boolean;
  created_at: string;
}
