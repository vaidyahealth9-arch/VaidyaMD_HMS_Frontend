import { request, getApiBase } from '@/lib/api';

export const documentsApi = {
  list: (patientId: string, category?: string) =>
    request<any[]>(`/core/documents?patient_id=${patientId}${category ? `&category=${category}` : ''}`),
  create: (data: { patient_id: string; file_name: string; file_path: string; mime_type?: string; category?: string; tags?: string[]; metadata?: Record<string, any> }) =>
    request<any>('/core/documents', { method: 'POST', body: JSON.stringify(data) }),
  delete: (documentId: string) =>
    request<void>(`/core/documents/${documentId}`, { method: 'DELETE' }),
  uploadFile: async (
    file: File,
    options?: { category?: string; document_type?: string; patient_id?: string }
  ): Promise<{ url: string; folder?: string; file_name: string; mime_type: string; file_size: number }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append('file', file);
    if (options?.category) formData.append('category', options.category);
    if (options?.document_type) formData.append('document_type', options.document_type);
    if (options?.patient_id) formData.append('patient_id', options.patient_id);

    const res = await fetch(`${apiBase}/core/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to upload document file' }));
      throw new Error(error.detail || 'File upload failed');
    }

    return res.json();
  },
};
