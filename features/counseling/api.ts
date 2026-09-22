import { request, toQueryString } from '@/lib/api';

export interface CounselingNote {
  id: string;
  patient_id: string;
  counselor_id?: string;
  counselor_name?: string;
  patient_name?: string;
  patient_vid?: string;
  source?: string;
  comments?: string;
  procedure?: string;
  egg_pick_up?: string;
  discussion?: string;
  laparoscopy_hysteroscopy?: string;
  egg_transfer?: string;
  remarks?: string;
  signature?: string;
  created_at: string;
  updated_at: string;
}

export const counselingApi = {
  listNotes: (params?: { patient_id?: string; search?: string; limit?: number; offset?: number }) =>
    request<CounselingNote[]>(`/core/counseling/notes${toQueryString(params)}`),
  getNote: (id: string) => request<CounselingNote>(`/core/counseling/notes/${id}`),
  createNote: (data: Record<string, unknown>) =>
    request<CounselingNote>('/core/counseling/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: Record<string, unknown>) =>
    request<CounselingNote>(`/core/counseling/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: string) =>
    request<any>(`/core/counseling/notes/${id}`, { method: 'DELETE' }),
  getStats: () => request<any>('/core/counseling/stats'),
};

