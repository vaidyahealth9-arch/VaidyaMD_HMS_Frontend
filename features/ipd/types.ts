export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred';
export type NursingTaskStatus = 'pending' | 'completed' | 'cancelled';

export interface Ward {
  id: string;
  name: string;
  ward_type?: string;
  floor?: string;
  total_beds?: number;
  occupied_beds?: number;
  description?: string;
}

export interface Bed {
  id: string;
  ward_id: string;
  ward_name?: string;
  bed_number: string;
  bed_type?: string;
  daily_rate?: number;
  status: BedStatus;
  patient_id?: string;
  patient_name?: string;
  admission_id?: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_mrn?: string;
  bed_id: string;
  bed_number?: string;
  ward_id?: string;
  ward_name?: string;
  admitting_doctor_id?: string;
  admitting_doctor_name?: string;
  admission_date: string;
  discharge_date?: string;
  diagnosis?: string;
  package_name?: string;
  notes?: string;
  status: AdmissionStatus;
}

export interface NursingTask {
  id: string;
  admission_id: string;
  bed_id: string;
  patient_name?: string;
  task_type: string;
  description: string;
  frequency?: string;
  scheduled_time?: string;
  status: NursingTaskStatus;
  completed_by_id?: string;
  completed_at?: string;
  vitals_payload?: Record<string, unknown>;
  notes?: string;
}
