import { request } from '@/lib/api';

export const documentsApi = {
  list: (patientId: string, category?: string) =>
    request<any[]>(`/core/documents?patient_id=${patientId}${category ? `&category=${category}` : ''}`),
  create: (data: { patient_id: string; file_name: string; file_path: string; mime_type?: string; category?: string; tags?: string[]; metadata?: Record<string, any> }) =>
    request<any>('/core/documents', { method: 'POST', body: JSON.stringify(data) }),
  delete: (documentId: string) =>
    request<void>(`/core/documents/${documentId}`, { method: 'DELETE' }),
};
