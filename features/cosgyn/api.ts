import { request } from '@/lib/api';
import type { CosGynTreatment, CosGynSession, CosGynPlan } from './types';

export const cosgynApi = {
  getTreatments: () => request<CosGynTreatment[]>('/plugins/cosgyn/treatments'),
  createTreatment: (data: Record<string, unknown>) =>
    request<CosGynTreatment>('/plugins/cosgyn/treatments', { method: 'POST', body: JSON.stringify(data) }),
  updateTreatment: (treatmentId: string, data: Record<string, unknown>) =>
    request<CosGynTreatment>(`/plugins/cosgyn/treatments/${treatmentId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTreatment: (treatmentId: string) =>
    request<{ success: boolean }>(`/plugins/cosgyn/treatments/${treatmentId}`, { method: 'DELETE' }),
  createPlan: (data: Record<string, unknown>) =>
    request<CosGynPlan>('/plugins/cosgyn/plans', { method: 'POST', body: JSON.stringify(data) }),
  getPatientPlans: (patientId: string) =>
    request<CosGynPlan[]>(`/plugins/cosgyn/plans/${patientId}`),
  getAllPlans: (patientId?: string) =>
    request<CosGynPlan[]>(patientId ? `/plugins/cosgyn/plans?patient_id=${patientId}` : '/plugins/cosgyn/plans'),
  updatePlanSchedule: (planId: string, data: { sessions: any[] }) =>
    request<{ success: boolean; plan: CosGynPlan }>(`/plugins/cosgyn/plans/${planId}/schedule`, { method: 'PUT', body: JSON.stringify(data) }),
  getSessions: () =>
    request<CosGynSession[]>('/plugins/cosgyn/sessions'),
  updateSession: (sessionId: string, data: Record<string, unknown>) =>
    request<CosGynSession>(`/plugins/cosgyn/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  billPlan: (planId: string, data?: Record<string, unknown>) =>
    request<any>(`/plugins/cosgyn/plans/${planId}/bill`, { method: 'POST', body: JSON.stringify(data || {}) }),
};
