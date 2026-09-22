import { request } from '@/lib/api';

export const cosgynApi = {
  getTreatments: () => request<any[]>('/plugins/cosgyn/treatments'),
  createTreatment: (data: Record<string, unknown>) =>
    request<any>('/plugins/cosgyn/treatments', { method: 'POST', body: JSON.stringify(data) }),
  updateTreatment: (treatmentId: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/cosgyn/treatments/${treatmentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTreatment: (treatmentId: string) =>
    request<any>(`/plugins/cosgyn/treatments/${treatmentId}`, { method: 'DELETE' }),
  createPlan: (data: Record<string, unknown>) =>
    request<any>('/plugins/cosgyn/plans', { method: 'POST', body: JSON.stringify(data) }),
  getPatientPlans: (patientId: string) =>
    request<any[]>(`/plugins/cosgyn/plans/${patientId}`),
  getSessions: () =>
    request<any[]>('/plugins/cosgyn/sessions'),
  updateSession: (sessionId: string, data: Record<string, unknown>) =>
    request<any>(`/plugins/cosgyn/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  billPlan: (planId: string) =>
    request<any>(`/plugins/cosgyn/plans/${planId}/bill`, { method: 'POST' }),
};
