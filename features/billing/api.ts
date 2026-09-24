import { request, toQueryString } from '@/lib/api';

// ==========================================
// 4. Billing, Packages, Wallet Feature API (Clean Architecture)
// ==========================================

export const walletApi = {
  get: (patientId: string) => request<any>(`/core/wallet/${patientId}`),
  getWallet: (patientId: string) => request<any>(`/core/wallet/${patientId}`),
  topUp: (patientId: string, data: { amount: number; payment_method: string; notes?: string }) =>
    request<any>(`/core/wallet/${patientId}/topup`, { method: 'POST', body: JSON.stringify(data) }),
  deposit: (patientIdOrData: any, amount?: number, payment_method: string = 'Cash', notes?: string) => {
    if (typeof patientIdOrData === 'object' && patientIdOrData !== null) {
      const pId = patientIdOrData.patient_id || patientIdOrData.id;
      return request<any>(`/core/wallet/${pId}/topup`, {
        method: 'POST',
        body: JSON.stringify({
          amount: patientIdOrData.amount,
          payment_method: patientIdOrData.payment_method || 'Cash',
          notes: patientIdOrData.notes,
        }),
      });
    }
    return request<any>(`/core/wallet/${patientIdOrData}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method, notes }),
    });
  },
  payInvoice: (patientId: string, data: { invoice_id: string; amount: number; discount?: number }) =>
    request<any>(`/core/wallet/${patientId}/pay-invoice`, { method: 'POST', body: JSON.stringify(data) }),
};

export const billingApi = {
  listInvoices: (params?: { status?: string; patient_id?: string; appointment_source?: string }) =>
    request<any[]>(`/core/billing/invoices${toQueryString(params)}`),
  getInvoice: (id: string) => request<any>(`/core/billing/invoices/${id}`),
  createInvoice: (data: Record<string, unknown>) =>
    request<any>('/core/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (id: string, data: { amount: number; payment_method: string; upi_pay_mode?: string; notes?: string; discount?: number }) =>
    request<any>(`/core/billing/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  listPackages: () => request<any[]>('/core/billing/packages'),
  createPackage: (data: Record<string, unknown>) =>
    request<any>('/core/billing/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/billing/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id: string) =>
    request<any>(`/core/billing/packages/${id}`, { method: 'DELETE' }),
  getServiceCatalog: (service_type?: string, q?: string) =>
    request<any[]>(`/core/billing/service-catalog${toQueryString({ service_type, q })}`),
  createServiceItem: (data: Record<string, unknown>) =>
    request<any>('/core/billing/service-catalog', { method: 'POST', body: JSON.stringify(data) }),
  updateServiceItem: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/billing/service-catalog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteServiceItem: (id: string) =>
    request<any>(`/core/billing/service-catalog/${id}`, { method: 'DELETE' }),
  getWallet: (patientId: string) => walletApi.get(patientId),
};

export const patientPackagesApi = {
  listByPatient: (patientId: string) =>
    request<any[]>(`/core/billing/patient-packages/patient/${patientId}`),
  assign: (data: { patient_id: string; package_id: string; invoice_id?: string; custom_items?: any[] }) =>
    request<any>('/core/billing/patient-packages/assign', { method: 'POST', body: JSON.stringify(data) }),
  consume: (packageId: string, data: { item_id: string; quantity: number; doctor_id?: string; notes?: string }) =>
    request<any>(`/core/billing/patient-packages/${packageId}/consume`, { method: 'POST', body: JSON.stringify(data) }),
};

