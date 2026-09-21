/**
 * VaidyaMD HMS — Patient & Couple Domain Types
 */

export type Gender = 'female' | 'male' | 'other';
export type RegistrationType = 'individual' | 'couple';

export interface Patient {
  id: string;
  vid: string;
  name: string;
  gender: Gender;
  dob?: string;
  age?: number;
  phone?: string;
  email?: string;
  blood_group?: string;
  address?: string;
  aadhaar_number?: string;
  registration_type: RegistrationType;
  partner_id?: string;
  partner?: Patient;
  referred_by_type?: string;
  referred_by_name?: string;
  marketing_person_name?: string;
  branch_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface CoupleProfile {
  female_patient: Patient;
  male_patient?: Patient;
  relationship_status?: string;
  years_of_infertility?: number;
}
