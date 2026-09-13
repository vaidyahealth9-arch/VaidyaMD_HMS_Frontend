import { request } from '@/lib/api';

export const opdApi = {
  getSchema: () => request<any>('/plugins/opd/schemas'),
  getOrderSets: () => request<any[]>('/core/templates?plugin_id=opd_order_set'),
  createOrderSet: (data: Record<string, unknown>) =>
    request<any>('/core/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderSet: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrderSet: (id: string) =>
    request<any>(`/core/templates/${id}`, { method: 'DELETE' }),
  parseScribeAudio: (payload?: { transcript_or_audio?: string; patient_id?: string; doctor_notes_context?: string }) =>
    request<any>('/core/ai-scribe/parse', { method: 'POST', body: JSON.stringify(payload || {}) }),
  saveConsultation: (data: { patient_id: string; data: Record<string, unknown>; created_by?: string; record_id?: string }) =>
    request<any>('/core/clinical-records', { method: 'POST', body: JSON.stringify(data) }),
  getPatientConsultations: (patientId: string) =>
    request<any[]>(`/core/clinical-records/${patientId}?plugin_id=opd`),
};
