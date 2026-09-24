// ─────────────────────────────────────────────────────────
// VaidyaMD HMS — Billing Domain Types
// Single source of truth — used by billing page, patient profile,
// cosgyn page, and all shared billing components.
// ─────────────────────────────────────────────────────────

export type InvoiceStatus = 'paid' | 'pending' | 'partially_paid' | 'draft' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer' | 'wallet';
export type DiscountType = 'amount' | 'percentage';

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  service_code?: string;
  patient_package_id?: string;
  package_item_id?: string;
  is_package_covered?: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name?: string;
  patient_vid?: string;
  appointment_source: string;
  reason_for_attendance?: string;
  total_amount: number;
  paid_amount: number;
  pending_due: number;
  status: InvoiceStatus;
  discount_type?: DiscountType;
  discount_value?: number;
  items?: LineItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Billing-context patient shape. For full patient profile use Patient from features/patients/types.
 * This is a lightweight subset used by billing components.
 */
export interface BillingPatient {
  id: string;
  vid: string;
  name: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  blood_group?: string;
  partner_name?: string;
  partner_id?: string;
  photo_url?: string;
  registration_type?: string;
  referred_by_name?: string;
  referred_by_type?: string;
  area?: string;
  mrn?: string;
  created_at: string;
}

export interface ServiceCatalogItem {
  name: string;
  code?: string;
  type?: string;
  category?: string;
  cost?: number;
  price?: number;
  base_price?: number;
  description?: string;
}

export interface PatientPackageItem {
  id: string;
  name: string;
  service_code?: string;
  remaining_qty: number;
  total_qty: number;
}

export interface PatientPackage {
  id: string;
  package_name: string;
  plugin_id?: string;
  status?: string;
  total_price?: number;
  created_at?: string;
  items: PatientPackageItem[];
}

export interface WalletInfo {
  balance: number;
  patient_id: string;
}

export interface DuesInfo {
  total_due: number;
  pending_count: number;
  invoices: Invoice[];
}

export interface RecordPaymentPayload {
  amount: number;
  payment_mode: PaymentMode;
  upi_pay_mode?: string;
  reference_number?: string;
  notes?: string;
  discount?: number;
}

export interface CreateInvoicePayload {
  patient_id: string;
  appointment_source: string;
  reason_for_attendance?: string;
  items: LineItem[];
  discount_type?: DiscountType;
  discount_value?: number;
  payment_status?: 'paid' | 'pending';
  payment_mode?: PaymentMode;
  upi_pay_mode?: string;
  paid_amount?: number;
  wallet_deduction?: number;
  patient_package_id?: string;
  notes?: string;
}
