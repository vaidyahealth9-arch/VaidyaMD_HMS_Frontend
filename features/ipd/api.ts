import { request, toQueryString } from '@/lib/api';

export const ipdApi = {
  listWards: () => request<any[]>('/core/ipd/wards'),
  createWard: (data: Record<string, unknown>) =>
    request<any>('/core/ipd/wards', { method: 'POST', body: JSON.stringify(data) }),
  updateWard: (wardId: string, data: Record<string, unknown>) =>
    request<any>(`/core/ipd/wards/${wardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWard: (wardId: string) =>
    request<any>(`/core/ipd/wards/${wardId}`, { method: 'DELETE' }),
  listBeds: (params?: { ward_id?: string; status?: string }) =>
    request<any[]>(`/core/ipd/beds${toQueryString(params)}`),
  createBed: (data: { ward_id: string; bed_number: string; bed_type?: string; daily_rate?: number; status?: string }) =>
    request<any>('/core/ipd/beds', { method: 'POST', body: JSON.stringify(data) }),
  updateBed: (bedId: string, data: Partial<{ bed_number: string; bed_type: string; daily_rate: number; status: string }>) =>
    request<any>(`/core/ipd/beds/${bedId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBed: (bedId: string) =>
    request<any>(`/core/ipd/beds/${bedId}`, { method: 'DELETE' }),
  updateBedStatus: (bedId: string, status: string) =>
    request<any>(`/core/ipd/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listAdmissions: (params?: { status?: string }) =>
    request<any[]>(`/core/ipd/admissions${toQueryString(params)}`),
  admitPatient: (data: { patient_id: string; bed_id: string; admitting_doctor_id?: string; diagnosis?: string; package_name?: string; notes?: string }) =>
    request<any>('/core/ipd/admissions', { method: 'POST', body: JSON.stringify(data) }),
  dischargePatient: (admissionId: string, notes?: string) =>
    request<any>(`/core/ipd/admissions/${admissionId}/discharge`, { method: 'POST', body: JSON.stringify({ notes }) }),
  transferBed: (admissionId: string, targetBedId: string) =>
    request<any>(`/core/ipd/admissions/${admissionId}/transfer-bed`, { method: 'POST', body: JSON.stringify({ target_bed_id: targetBedId }) }),
  listNursingTasks: (params?: { admission_id?: string; bed_id?: string; status?: string }) =>
    request<any[]>(`/core/ipd/nursing-tasks${toQueryString(params)}`),
  createNursingTask: (data: { admission_id: string; bed_id: string; task_type: string; description: string; frequency?: string; scheduled_time?: string }) =>
    request<any>('/core/ipd/nursing-tasks', { method: 'POST', body: JSON.stringify(data) }),
  completeNursingTask: (taskId: string, data: { completed_by_id?: string; vitals_payload?: Record<string, any>; notes?: string }) =>
    request<any>(`/core/ipd/nursing-tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  accrueDailyCharges: () =>
    request<any>('/core/ipd/accrue-daily-charges', { method: 'POST' }),
};
