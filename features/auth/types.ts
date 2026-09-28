/**
 * VaidyaMD HMS — Auth Domain Types
 */

export type UserRole =
  | 'admin'
  | 'superadmin'
  | 'doctor'
  | 'embryologist'
  | 'counsellor'
  | 'nurse'
  | 'pharmacist'
  | 'lab_technician'
  | 'cashier'
  | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  is_doctor?: boolean;
  department?: string;
  specialization?: string;
  qualification?: string;
  registration_number?: string;
  is_active: boolean;
  branch_id?: string;
  tenant_id?: string;
  hospital_name?: string;
  hospital_logo_url?: string;
  hospital_address?: string;
  hospital_phone?: string;
  hospital_email?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user: User;
}
