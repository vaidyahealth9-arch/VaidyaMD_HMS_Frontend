/**
 * VaidyaMD HMS — Billing & Wallet Domain Types
 */

export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'cancelled';

export interface InvoiceItem {
  id?: string;
  item_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  department?: string;
  resolved_from_leakage_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name?: string;
  patient_vid?: string;
  appointment_source?: string;
  reason_for_attendance?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  wallet_amount_used?: number;
  status: InvoiceStatus;
  payment_method?: string;
  items: InvoiceItem[];
  branch_id?: string;
  tenant_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface TreatmentPackage {
  id: string;
  name: string;
  code?: string;
  package_type: string;
  total_price: number;
  description?: string;
  included_items?: Array<{ name: string; qty: number }>;
}

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  department?: string;
}

export interface PatientWallet {
  id: string;
  patient_id: string;
  balance: number;
  currency: string;
}
