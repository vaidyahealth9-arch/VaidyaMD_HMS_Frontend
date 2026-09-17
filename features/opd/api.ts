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
  getTemplates: (pluginId: string = 'opd_order_set') =>
    request<any[]>(`/core/templates?plugin_id=${pluginId}`),
  createTemplate: (data: Record<string, unknown>) =>
    request<any>('/core/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    request<any>(`/core/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    request<any>(`/core/templates/${id}`, { method: 'DELETE' }),
  saveConsultation: (params: {
    patient_id: string;
    data: Record<string, unknown>;
    created_by?: string;
    record_id?: string | null;
    record_type?: string;
    plugin_id?: string;
  }) => {
    if (params.record_id) {
      return request<any>(`/core/clinical-records/${params.record_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...params.data,
          record_type: params.record_type || (params.data?.record_type as string) || 'opd_consultation',
        }),
      });
    }
    const payload = {
      patient_id: params.patient_id,
      record_type: params.record_type || (params.data?.record_type as string) || 'opd_consultation',
      plugin_id: params.plugin_id || 'opd',
      data: params.data,
      created_by: params.created_by || undefined,
    };
    return request<any>('/core/clinical-records/', { method: 'POST', body: JSON.stringify(payload) });
  },
  getPatientConsultations: (patientId: string) =>
    request<any[]>(`/core/clinical-records/${patientId}?plugin_id=opd`),
};
