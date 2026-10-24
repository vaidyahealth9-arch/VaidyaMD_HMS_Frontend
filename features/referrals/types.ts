// ─────────────────────────────────────────────────────────
// VaidyaMD HMS — Referral & Commission Domain Types
// ─────────────────────────────────────────────────────────

export interface DepartmentBreakdown {
  opd: number;
  pharmacy: number;
  iui: number;
  embryology: number;
  lims: number;
  ipd: number;
  other: number;
}

export interface ReferringDoctor {
  id: string;
  tenant_id: string;
  name: string;
  clinic_name?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  pan_number?: string;
  custom_commission_pct?: number;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReferringDoctorCreate {
  name: string;
  clinic_name?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  pan_number?: string;
  custom_commission_pct?: number;
  notes?: string;
  is_active?: boolean;
}

export interface ReferralSettlement {
  id: string;
  settlement_number: string;
  tenant_id: string;
  doctor_name: string;
  doctor_id?: string;
  amount_paid: number;
  payment_method: string;
  reference_number?: string;
  settlement_date: string;
  notes?: string;
  invoice_ids: string[];
  created_by?: string;
  created_at: string;
}

export interface ReferralSettlementCreate {
  doctor_name: string;
  amount_paid: number;
  payment_method: string;
  reference_number?: string;
  settlement_date?: string;
  notes?: string;
  invoice_ids: string[];
}

export interface ReferralInvoiceReportItem {
  patient_id: string;
  patient_name: string;
  patient_vid?: string;
  patient_mrn?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  referring_doctor: string;
  marketing_person?: string;
  treatment_protocol: string;
  cycle_status?: string;

  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_status: string;
  payment_method?: string;

  subsections: DepartmentBreakdown;
  subtotal: number;
  discount: number;
  round_off: number;
  net_total: number;
  paid_amount: number;
  pending_due: number;
  commission_amount: number;

  is_settled: boolean;
  settlement_number?: string;
  settlement_date?: string;
}

export interface PatientReferralCardItem {
  patient_id: string;
  patient_name: string;
  patient_vid?: string;
  patient_mrn?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  treatment_protocol: string;
  cycle_status?: string;
  conversion_badge: string;

  total_billed: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
  settled_commission: number;
  pending_commission: number;
  invoices: ReferralInvoiceReportItem[];
}

export interface DoctorDirectoryItem {
  doctor_name: string;
  doctor_profile?: ReferringDoctor;
  patient_count: number;
  invoice_count: number;
  total_revenue: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
  settled_commission: number;
  pending_commission: number;
  has_unsettled: boolean;
  converted_count?: number;
  conversion_rate_pct?: number;
}

export interface DoctorHierarchyDetailResponse {
  doctor_name: string;
  doctor_profile?: ReferringDoctor;
  total_patients_count: number;
  total_invoices_count: number;
  total_revenue: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
  settled_commission: number;
  pending_commission: number;
  departmental_totals: DepartmentBreakdown;
  patients: PatientReferralCardItem[];
  settlements: ReferralSettlement[];
}

export interface DoctorSummaryItem {
  doctor_name: string;
  patient_count: number;
  invoice_count: number;
  total_revenue: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
}

export interface ReferralSummaryResponse {
  total_referred_patients: number;
  total_invoices_count: number;
  total_revenue: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
  departmental_totals: DepartmentBreakdown;
  top_doctors: DoctorSummaryItem[];
}

export interface HospitalReferralOverviewResponse {
  total_referral_revenue: number;
  total_paid: number;
  total_due: number;
  total_commission: number;
  settled_commission: number;
  pending_commission: number;
  total_patients_count: number;
  total_invoices_count: number;
  converted_cycles_count: number;
  conversion_rate_pct: number;
  active_referring_doctors_count: number;
  departmental_totals: DepartmentBreakdown;
  doctors_league: DoctorDirectoryItem[];
  recent_settlements: ReferralSettlement[];
}

export interface CommissionConfigSchema {
  opd_pct: number;
  pharmacy_pct: number;
  iui_pct: number;
  embryology_pct: number;
  lims_pct: number;
  ipd_pct: number;
  other_pct: number;
}
