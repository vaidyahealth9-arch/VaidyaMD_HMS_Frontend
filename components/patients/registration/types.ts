export interface PatientRegistrationFormState {
  registration_type: string;
  title: string;
  name: string;
  surname: string;
  surname_at_birth: string;
  gender: string;
  age: string;
  dob: string;
  marital_status: string;
  phone: string;
  alternate_phone: string;
  email: string;
  address: string;
  education_qualification: string;
  occupation: string;
  nationality: string;
  mother_tongue: string;
  blood_group: string;
  photo_url: string;
  identity_type: string;
  aadhaar_number: string;
  abha_number: string;
  referred_by_type: string;
  referred_by_name: string;
  referring_doctor: string;
  marketing_person_name: string;
  area: string;
  treating_doctor_id: string;
  financial_type: string;
  is_surrogate: boolean;
  alert_notes_text: string;
  clinical_notes_text: string;
  // Donor specific
  donor_type: string;
  donor_bank_code: string;
  serology_status: string;
  karyotype_status: string;
}

export interface PartnerRegistrationFormState {
  title: string;
  name: string;
  surname: string;
  age: string;
  dob: string;
  gender: string;
  marital_status: string;
  phone: string;
  email: string;
  occupation: string;
  education_qualification: string;
  blood_group: string;
  identity_type: string;
  aadhaar_number: string;
  abha_number: string;
}

export interface DocumentUploadFile {
  name: string;
  dataUrl: string;
  type: string;
  size: string;
  fileObj?: File;
}

export interface RegistrationSuccessData {
  primary: any;
  partner?: any;
}

export type RegistrationMode = 'couple' | 'individual';

export const BLOOD_GROUPS = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];
