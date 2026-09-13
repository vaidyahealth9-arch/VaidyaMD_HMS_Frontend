import { request, toQueryString } from '@/lib/api';

export const pharmacyApi = {
  listIndents: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/indents${toQueryString(params)}`),
  createIndent: (data: { requesting_department: string; requested_by_id?: string; urgency?: string; items: any[]; notes?: string }) =>
    request<any>('/core/pharmacy/indents', { method: 'POST', body: JSON.stringify(data) }),
  updateIndentStatus: (id: string, status: string) =>
    request<any>(`/core/pharmacy/indents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listPurchaseOrders: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/purchase-orders${toQueryString(params)}`),
  createPurchaseOrder: (data: { vendor_name: string; vendor_gst?: string; items: any[]; total_amount: number; expected_delivery_date?: string; notes?: string }) =>
    request<any>('/core/pharmacy/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),

  listGRNs: (params?: { status?: string }) =>
    request<any[]>(`/core/pharmacy/grns${toQueryString(params)}`),
  createGRN: (data: { invoice_number: string; vendor_name: string; total_amount: number; po_id?: string; items: any[]; ocr_raw_data?: any; verified_by_id?: string }) =>
    request<any>('/core/pharmacy/grns', { method: 'POST', body: JSON.stringify(data) }),
  stockGRN: (id: string) =>
    request<any>(`/core/pharmacy/grns/${id}/stock`, { method: 'POST' }),

  listBatches: (params?: { category?: string; search?: string }) =>
    request<any[]>(`/core/pharmacy/batches${toQueryString(params)}`),
  
  parseOcrInvoice: (payload?: { base64_image?: string; invoice_hint?: string; file_name?: string; vendor_name?: string } | Record<string, any>) =>
    request<any>('/core/pharmacy/ocr/invoice', { method: 'POST', body: JSON.stringify(payload || {}) }),

  dispenseFEFO: (data: { patient_id: string; items: Array<{ item_code: string; quantity: number }>; doctor_id?: string; notes?: string }) =>
    request<any>('/core/pharmacy/dispense', { method: 'POST', body: JSON.stringify(data) }),
};
