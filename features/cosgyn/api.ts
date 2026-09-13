import { request } from '@/lib/api';

export const cosgynApi = {
  getTreatments: () => request<any[]>('/plugins/cosgyn/treatments'),
  createPlan: (data: Record<string, unknown>) =>
    request<any>('/plugins/cosgyn/plans', { method: 'POST', body: JSON.stringify(data) }),
  getPatientPlans: (patientId: string) =>
    request<any[]>(`/plugins/cosgyn/plans/${patientId}`),
  updateSession: (sessionId: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/cosgyn/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  billPlan: (planId: string) =>
    request<any>(`/plugins/cosgyn/plans/${planId}/bill`, { method: 'POST' }),
};
