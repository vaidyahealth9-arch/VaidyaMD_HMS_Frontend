import { request, toQueryString } from '@/lib/api';

export const limsApi = {
  getWorklist: (params?: { status?: string; test_type?: string }) =>
    request<any[]>(`/core/lims/worklist${toQueryString(params)}`),
  getRecord: (id: string) =>
    request<any>(`/core/lims/records/${id}`),
  createManualReport: (data: { patient_id: string; test_name: string; category?: string; sample_id?: string; observations?: Record<string, any>; pathologist_notes?: string }) =>
    request<any>('/core/lims/manual-report', { method: 'POST', body: JSON.stringify(data) }),

  authorizeReport: (id: string, data: { pathologist_id?: string; comments?: string; verified_values?: Record<string, any> }) =>
    request<any>(`/core/lims/records/${id}/authorize`, { method: 'POST', body: JSON.stringify(data) }),
};
