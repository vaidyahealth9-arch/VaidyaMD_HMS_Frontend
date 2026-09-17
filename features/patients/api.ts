import { request, toQueryString } from '@/lib/api';

// ==========================================
// Patients Feature API (Clean Architecture)
// ==========================================
export const patientsApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; referred_by_type?: string; area?: string; gender?: string; branch_id?: string; start_date?: string; end_date?: string }) =>
    request<any>(`/core/patients/${toQueryString(params)}`),
  get: (id: string) => request<any>(`/core/patients/${id}`),
  getTimeline: (id: string) => request<any>(`/core/patients/${id}/timeline`),
  getCouple: (id: string) => request<any>(`/core/patients/${id}/couple`),
  create: (data: Record<string, unknown>) =>
    request<any>('/core/patients/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  linkPartner: (id: string, partnerId: string) =>
    request<any>(`/core/patients/${id}/link-partner`, { method: 'POST', body: JSON.stringify({ partner_id: partnerId }) }),
  unlinkPartner: (id: string) =>
    request<any>(`/core/patients/${id}/unlink-partner`, { method: 'DELETE' }),
  updateAlerts: (id: string, alertNotes: string[]) =>
    request<any>(`/core/patients/${id}`, { method: 'PATCH', body: JSON.stringify({ alert_notes: alertNotes }) }),
  updateClinicalNotes: (id: string, clinicalNotes: string[]) =>
    request<any>(`/core/patients/${id}`, { method: 'PATCH', body: JSON.stringify({ clinical_notes: clinicalNotes }) }),
  saveConsent: (id: string, data: { title: string; signature: string }) =>
    request<any>(`/core/patients/${id}/consents`, { method: 'POST', body: JSON.stringify(data) }),
};
