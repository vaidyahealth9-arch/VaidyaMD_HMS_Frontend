import { request, toQueryString } from '@/lib/api';

// ==========================================
// 3. Appointments Feature API (Clean Architecture)
// ==========================================
export const appointmentsApi = {
  list: (params?: { date_filter?: string; status?: string; gender?: string; department?: string; branch_id?: string; patient_id?: string }) =>
    request<{ appointments: any[]; total: number }>(`/core/appointments/${toQueryString(params)}`),
  get: (id: string) =>
    request<any>(`/core/appointments/${id}`),
  create: (data: Record<string, unknown>) =>
    request<any>('/core/appointments/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  triage: (id: string, data: { vitals: Record<string, any>; chief_complaint?: string; nurse_notes?: string }) =>
    request<any>(`/core/appointments/${id}/triage`, { method: 'PATCH', body: JSON.stringify(data) }),
};
