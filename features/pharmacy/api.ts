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

  listBatches: (params?: { category?: string; search?: string; active_only?: boolean }) =>
    request<any[]>(`/core/pharmacy/batches${toQueryString(params)}`),
  createBatch: (data: Record<string, unknown>) =>
    request<any>('/core/pharmacy/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/pharmacy/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id: string, params?: { deactivate_all?: boolean }) =>
    request<any>(`/core/pharmacy/batches/${id}${toQueryString(params)}`, { method: 'DELETE' }),
  
  parseOcrInvoice: (payload?: { base64_image?: string; invoice_hint?: string; file_name?: string; vendor_name?: string } | Record<string, any>) =>
    request<any>('/core/pharmacy/ocr/invoice', { method: 'POST', body: JSON.stringify(payload || {}) }),

  dispenseFEFO: (data: { patient_id: string; items: Array<{ item_code: string; quantity: number }>; doctor_id?: string; notes?: string; discount?: number; amount_paid?: number; payment_method?: string; payment_ref?: string; wallet_amount_used?: number; upi_pay_mode?: string; split_payments?: any[] }) =>
    request<any>('/core/pharmacy/dispense', { method: 'POST', body: JSON.stringify(data) }),

  listVendors: () =>
    request<any[]>('/core/pharmacy/vendors'),

  createVendor: (data: Record<string, unknown>) =>
    request<any>('/core/pharmacy/vendors', { method: 'POST', body: JSON.stringify(data) }),

  updateVendor: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/pharmacy/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteVendor: (id: string) =>
    request<any>(`/core/pharmacy/vendors/${id}`, { method: 'DELETE' }),

  downloadStockTemplateCsv: async (filename: string = '11b_pharmacy_stock_template.csv') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const { getApiBase, ApiError } = await import('@/lib/api');
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/core/pharmacy/inventory/template-csv`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to download pharmacy stock template CSV');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  previewStockCsv: async (file: File | Blob, conflictMode: 'overwrite' | 'skip' = 'overwrite') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const { getApiBase, ApiError } = await import('@/lib/api');
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'pharmacy_stock.csv');
    formData.append('conflict_mode', conflictMode);

    const res = await fetch(`${apiBase}/core/pharmacy/inventory/preview-csv`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Pharmacy stock preview failed' }));
      throw new ApiError(res.status, err.detail || 'Pharmacy stock preview failed');
    }

    return res.json();
  },

  importStockCsv: async (file: File | Blob, conflictMode: 'overwrite' | 'skip' = 'overwrite', dryRun: boolean = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const { getApiBase, ApiError } = await import('@/lib/api');
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'pharmacy_stock.csv');
    formData.append('conflict_mode', conflictMode);
    if (dryRun) {
      formData.append('dry_run', 'true');
    }

    const res = await fetch(`${apiBase}/core/pharmacy/inventory/import-csv`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Pharmacy stock import failed' }));
      throw new ApiError(res.status, err.detail || 'Pharmacy stock import failed');
    }

    return res.json();
  },
};

