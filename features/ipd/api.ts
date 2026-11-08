import { request, toQueryString } from '@/lib/api';
import type {
  Ward,
  Bed,
  Admission,
  AdmissionDetails,
  NursingTask,
  RoundNote,
  IPDOrder,
  FluidBalance,
  DischargeSummary,
  BedStatus,
} from './types';

export const ipdApi = {
  // Wards
  listWards: () => request<Ward[]>('/core/ipd/wards'),
  createWard: (data: Partial<Ward> & { name: string; code: string; total_beds?: number; base_charge_per_day?: number; department?: string; branch_id?: string | null }) =>
    request<Ward>('/core/ipd/wards', { method: 'POST', body: JSON.stringify(data) }),
  updateWard: (wardId: string, data: Partial<Ward>) =>
    request<Ward>(`/core/ipd/wards/${wardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWard: (wardId: string) =>
    request<{ success: boolean; message?: string }>(`/core/ipd/wards/${wardId}`, { method: 'DELETE' }),

  // Beds
  listBeds: (params?: { ward_id?: string; status?: string }) =>
    request<Bed[]>(`/core/ipd/beds${toQueryString(params)}`),
  createBed: (data: { ward_id: string; bed_number: string; bed_type?: string; daily_rate?: number; status?: string }) =>
    request<Bed>('/core/ipd/beds', { method: 'POST', body: JSON.stringify(data) }),
  updateBed: (bedId: string, data: Partial<{ bed_number: string; bed_type: string; daily_rate: number; status: string }>) =>
    request<Bed>(`/core/ipd/beds/${bedId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBed: (bedId: string) =>
    request<{ success: boolean; message?: string }>(`/core/ipd/beds/${bedId}`, { method: 'DELETE' }),
  updateBedStatus: (bedId: string, status: BedStatus | string) =>
    request<Bed>(`/core/ipd/beds/${bedId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Admissions
  listAdmissions: (params?: { status?: string }) =>
    request<Admission[]>(`/core/ipd/admissions${toQueryString(params)}`),
  getAdmissionDetails: (admissionId: string) =>
    request<AdmissionDetails>(`/core/ipd/admissions/${admissionId}`),
  updateAdmission: (admissionId: string, data: Record<string, unknown>) =>
    request<{ message: string; admission_id: string }>(`/core/ipd/admissions/${admissionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  admitPatient: (data: {
    patient_id: string;
    bed_id: string;
    admitting_doctor_id?: string;
    diagnosis?: string;
    package_name?: string;
    notes?: string;
    allergies?: string[];
    risk_factors?: Record<string, boolean>;
    advance_amount?: number;
  }) =>
    request<{ message: string; admission_id: string; admission_number: string }>('/core/ipd/admissions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transferBed: (admissionId: string, targetBedId: string, notes?: string) =>
    request<{ message: string; bed_id: string }>(`/core/ipd/admissions/${admissionId}/transfer-bed`, {
      method: 'POST',
      body: JSON.stringify({ target_bed_id: targetBedId, notes }),
    }),

  // Clinical Discharge Summary & Settlement
  getDischargeSummary: (admissionId: string) =>
    request<any>(`/core/ipd/admissions/${admissionId}/discharge-summary`),
  saveDischargeSummary: (admissionId: string, data: DischargeSummary) =>
    request<{ message: string; admission_id: string }>(`/core/ipd/admissions/${admissionId}/save-discharge-summary`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  dischargePatient: (
    admissionId: string,
    data?: string | { notes?: string; invoice_id?: string; discharge_summary?: Record<string, unknown> }
  ) => {
    const payload = typeof data === 'string' ? { notes: data } : data || {};
    return request<{ message: string }>(`/core/ipd/admissions/${admissionId}/discharge`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Doctor Round Notes (SOAP)
  listRoundNotes: (admissionId: string) =>
    request<RoundNote[]>(`/core/ipd/admissions/${admissionId}/round-notes`),
  createRoundNote: (
    admissionId: string,
    data: { doctor_id?: string; subjective?: string; objective?: string; assessment?: string; plan?: string; notes?: string }
  ) =>
    request<{ id: string; message: string }>(`/core/ipd/admissions/${admissionId}/round-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Bedside Orders & eMAR
  listOrders: (admissionId: string) =>
    request<IPDOrder[]>(`/core/ipd/admissions/${admissionId}/orders`),
  createOrder: (
    admissionId: string,
    data: {
      order_type: string;
      item_name: string;
      dosage?: string;
      route?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }
  ) =>
    request<{ id: string; message: string }>(`/core/ipd/admissions/${admissionId}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrderStatus: (orderId: string, status: string, notes?: string) =>
    request<{ message: string; order_id: string }>(`/core/ipd/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  administerOrder: (orderId: string, data: { status: string; notes?: string; administered_by_name?: string }) =>
    request<{ message: string; logs: any[] }>(`/core/ipd/orders/${orderId}/administer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Fluid Balance (I/O)
  listFluidBalances: (admissionId: string) =>
    request<FluidBalance[]>(`/core/ipd/admissions/${admissionId}/fluid-balance`),
  createFluidBalance: (
    admissionId: string,
    data: {
      shift: string;
      intake_oral?: number;
      intake_iv?: number;
      intake_other?: number;
      output_urine?: number;
      output_drain?: number;
      output_vomitus?: number;
      output_other?: number;
      notes?: string;
    }
  ) =>
    request<{ id: string; message: string }>(`/core/ipd/admissions/${admissionId}/fluid-balance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Nursing Tasks & Vitals
  listNursingTasks: (params?: { admission_id?: string; bed_id?: string; status?: string }) =>
    request<NursingTask[]>(`/core/ipd/nursing-tasks${toQueryString(params)}`),
  createNursingTask: (data: {
    admission_id: string;
    bed_id: string;
    task_type: string;
    description: string;
    frequency?: string;
    scheduled_time?: string;
  }) =>
    request<NursingTask>('/core/ipd/nursing-tasks', { method: 'POST', body: JSON.stringify(data) }),
  completeNursingTask: (
    taskId: string,
    data: { completed_by_id?: string; vitals_payload?: Record<string, unknown>; notes?: string }
  ) =>
    request<NursingTask>(`/core/ipd/nursing-tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  // Accrual
  accrueDailyCharges: () =>
    request<{ success: boolean; message: string }>('/core/ipd/accrue-daily-charges', { method: 'POST' }),
};
