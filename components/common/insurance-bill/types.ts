export interface InsuranceDetails {
  claim_no?: string;
  policy_no?: string;
  medical_card_no?: string;
  tpa_name?: string;
  tpa_gst_no?: string;
  organization?: string;
  org_gst_no?: string;
  gst_no?: string;
  dl_no?: string;
  bill_type?: 'IP Approximate Bill' | 'Bill Of Supply' | 'IP Final Discharge Bill';
  approx_bill_no?: string;
  admission_no?: string;
  umr_no?: string;
  admission_date?: string;
  discharge_date?: string;
  to_be_discharged_dt?: string;
  department?: string;
  admitted_bed?: string;
  consultant?: string;
}

export interface InsuranceBillItem {
  id: string;
  bill_date?: string;
  service_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  gst_amount?: number;
  is_cash_service?: boolean; // Marked with '*'
  is_excluded?: boolean;    // Removed from bill
}

export interface InsurancePatientInfo {
  name: string;
  vid?: string;
  mrn?: string;
  age?: number | string;
  gender?: string;
  phone?: string;
  address?: string;
  title?: string;
}
